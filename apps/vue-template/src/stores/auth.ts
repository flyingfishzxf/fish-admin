import type { AuthUser } from '@fish-admin/contracts'
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

import {
  isMfaRequired,
  loginRequest,
  logoutRequest,
  meRequest,
  refreshRequest,
  type LoginResponse,
  type TokenPair,
} from '../features/auth/api'
import { ApiError } from '../lib/api-error'
import { queryClient } from '../lib/query-client'

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'anonymous'
const SESSION_KEY = 'fish-admin:session'

function readStoredSession() {
  const empty = { accessToken: null as string | null, refreshToken: null as string | null }
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return empty
    const parsed = JSON.parse(raw) as { state?: { accessToken?: unknown; refreshToken?: unknown } }
    return {
      accessToken: typeof parsed.state?.accessToken === 'string' ? parsed.state.accessToken : null,
      refreshToken:
        typeof parsed.state?.refreshToken === 'string' ? parsed.state.refreshToken : null,
    }
  } catch {
    return empty
  }
}

let refreshInFlight: Promise<boolean> | null = null
let bootstrapInFlight: Promise<void> | null = null

export const useAuthStore = defineStore('auth', () => {
  const stored = readStoredSession()
  const user = ref<AuthUser | null>(null)
  const accessToken = ref<string | null>(stored.accessToken)
  const refreshToken = ref<string | null>(stored.refreshToken)
  const status = ref<AuthStatus>('idle')

  watch([accessToken, refreshToken], () => {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        state: { accessToken: accessToken.value, refreshToken: refreshToken.value },
        version: 1,
      }),
    )
  })

  function clearSession() {
    user.value = null
    accessToken.value = null
    refreshToken.value = null
    status.value = 'anonymous'
  }

  async function completeLogin(tokens: TokenPair) {
    accessToken.value = tokens.accessToken
    refreshToken.value = tokens.refreshToken
    status.value = 'loading'
    try {
      user.value = await meRequest(tokens.accessToken)
      status.value = 'authenticated'
      queryClient.clear()
    } catch (error) {
      clearSession()
      throw error
    }
  }

  async function login(email: string, password: string): Promise<LoginResponse> {
    status.value = 'loading'
    try {
      const result = await loginRequest(email, password)
      if (isMfaRequired(result)) {
        throw new ApiError(200, 'MFA_NOT_SUPPORTED', 'Two-factor sign-in is not supported.')
      }
      await completeLogin(result)
      return result
    } catch (error) {
      clearSession()
      throw error
    }
  }

  async function logout() {
    const token = refreshToken.value
    clearSession()
    queryClient.clear()
    if (token) {
      try {
        await logoutRequest(token)
      } catch {
        // The local session is already gone; a failed network call is harmless.
      }
    }
  }

  async function bootstrap() {
    if (bootstrapInFlight) return bootstrapInFlight
    bootstrapInFlight = (async () => {
      status.value = 'loading'
      if (!refreshToken.value) {
        status.value = 'anonymous'
        return
      }
      if (accessToken.value) {
        try {
          user.value = await meRequest(accessToken.value)
          status.value = 'authenticated'
          return
        } catch {
          // Expired or rejected; refresh below.
        }
      }
      if (!(await refreshSession())) {
        status.value = 'anonymous'
        return
      }
      if (!accessToken.value) {
        status.value = 'anonymous'
        return
      }
      try {
        user.value = await meRequest(accessToken.value)
        status.value = 'authenticated'
      } catch {
        clearSession()
      }
    })().finally(() => {
      bootstrapInFlight = null
    })
    return bootstrapInFlight
  }

  async function refreshSession() {
    if (refreshInFlight) return refreshInFlight
    const current = refreshToken.value
    if (!current) return false
    refreshInFlight = (async () => {
      try {
        const tokens = await refreshRequest(current)
        accessToken.value = tokens.accessToken
        refreshToken.value = tokens.refreshToken
        return true
      } catch {
        accessToken.value = null
        refreshToken.value = null
        return false
      }
    })().finally(() => {
      refreshInFlight = null
    })
    return refreshInFlight
  }

  return {
    user,
    accessToken,
    refreshToken,
    status,
    login,
    completeLogin,
    logout,
    bootstrap,
    refreshSession,
    clearSession,
  }
})
