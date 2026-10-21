import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import {
  isMfaRequired,
  loginRequest,
  logoutRequest,
  meRequest,
  refreshRequest,
  verifyMfaRequest,
  type LoginResponse,
  type TokenPair,
} from '@/features/auth/api'
import { queryClient } from '@/lib/query-client'
import type { AuthUser } from '@/types'

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'anonymous'

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  status: AuthStatus
  login: (email: string, password: string) => Promise<LoginResponse>
  completeLogin: (tokens: TokenPair) => Promise<void>
  completeMfa: (challengeId: string, code: string) => Promise<void>
  logout: () => Promise<void>
  bootstrap: () => Promise<void>
  refreshSession: () => Promise<boolean>
  refreshUser: () => Promise<void>
  clearSession: () => void
  updateUser: (patch: Partial<AuthUser>) => void
}

let refreshInFlight: Promise<boolean> | null = null
let bootstrapInFlight: Promise<void> | null = null

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      status: 'idle',

      async login(email, password) {
        set({ status: 'loading' })
        try {
          const result = await loginRequest(email, password)
          if (isMfaRequired(result)) {
            set({ user: null, accessToken: null, refreshToken: null, status: 'anonymous' })
            return result
          }
          await get().completeLogin(result)
          return result
        } catch (error) {
          set({ user: null, accessToken: null, refreshToken: null, status: 'anonymous' })
          throw error
        }
      },

      async completeLogin(tokens) {
        set({ ...tokens, status: 'loading' })
        try {
          const user = await meRequest(tokens.accessToken)
          set({ user, status: 'authenticated' })
          queryClient.clear()
        } catch (error) {
          set({ user: null, accessToken: null, refreshToken: null, status: 'anonymous' })
          throw error
        }
      },

      async completeMfa(challengeId, code) {
        const tokens = await verifyMfaRequest(challengeId, code)
        await get().completeLogin(tokens)
      },

      async logout() {
        const refreshToken = get().refreshToken
        set({ user: null, accessToken: null, refreshToken: null, status: 'anonymous' })
        queryClient.clear()

        if (refreshToken) {
          try {
            await logoutRequest(refreshToken)
          } catch {
            // The local session is already cleared, so a failed network call is harmless.
          }
        }
      },

      async bootstrap() {
        if (bootstrapInFlight) return bootstrapInFlight

        bootstrapInFlight = (async () => {
          set({ status: 'loading' })

          if (!get().refreshToken) {
            set({ status: 'anonymous' })
            return
          }

          // Prefer the cached access token: the mock rotates the single-use refresh
          // token on every boot, so a reload could otherwise persist a stale token.
          const cachedAccessToken = get().accessToken
          if (cachedAccessToken) {
            try {
              const user = await meRequest(cachedAccessToken)
              set({ user, status: 'authenticated' })
              return
            } catch {
              // Expired or rejected; fall back to a refresh below.
            }
          }

          const refreshed = await get().refreshSession()
          if (!refreshed) {
            set({ status: 'anonymous' })
            return
          }

          const accessToken = get().accessToken
          if (!accessToken) {
            set({ status: 'anonymous' })
            return
          }

          try {
            const user = await meRequest(accessToken)
            set({ user, status: 'authenticated' })
          } catch {
            set({ user: null, accessToken: null, refreshToken: null, status: 'anonymous' })
          }
        })().finally(() => {
          bootstrapInFlight = null
        })

        return bootstrapInFlight
      },

      async refreshSession() {
        if (refreshInFlight) return refreshInFlight

        const currentRefreshToken = get().refreshToken
        if (!currentRefreshToken) return false

        refreshInFlight = (async () => {
          try {
            const tokens = await refreshRequest(currentRefreshToken)
            set({ ...tokens })
            return true
          } catch {
            set({ accessToken: null, refreshToken: null })
            return false
          }
        })().finally(() => {
          refreshInFlight = null
        })

        return refreshInFlight
      },

      async refreshUser() {
        let accessToken = get().accessToken
        if (!accessToken) return

        try {
          const user = await meRequest(accessToken)
          set({ user, status: 'authenticated' })
          return
        } catch {
          const refreshed = await get().refreshSession()
          if (!refreshed) return
          accessToken = get().accessToken
          if (!accessToken) return
        }

        try {
          const user = await meRequest(accessToken)
          set({ user, status: 'authenticated' })
        } catch {
          // Leave the current session untouched; the next API call handles expiry.
        }
      },

      clearSession() {
        set({ user: null, accessToken: null, refreshToken: null, status: 'anonymous' })
      },

      updateUser(patch) {
        const user = get().user
        if (user) set({ user: { ...user, ...patch } })
      },
    }),
    {
      name: 'fish-admin:session',
      version: 1,
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
)
