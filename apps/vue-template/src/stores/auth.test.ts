import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../lib/api-error'
import { queryClient } from '../lib/query-client'
import {
  isMfaRequired,
  loginRequest,
  logoutRequest,
  meRequest,
  refreshRequest,
} from '../features/auth/api'
import { useAuthStore } from './auth'

vi.mock('../features/auth/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../features/auth/api')>()),
  loginRequest: vi.fn(),
  refreshRequest: vi.fn(),
  logoutRequest: vi.fn(),
  meRequest: vi.fn(),
}))

const user = {
  id: 'u1',
  name: 'Ada',
  email: 'ada@fish.dev',
  roleId: 'r1',
  roleName: 'Admin',
  permissions: ['*'],
  emailVerified: true,
  twoFactorEnabled: false,
}

describe('auth store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.mocked(loginRequest).mockReset()
    vi.mocked(refreshRequest).mockReset()
    vi.mocked(logoutRequest).mockReset()
    vi.mocked(meRequest).mockReset()
  })

  it('logs in, loads the user and persists only tokens', async () => {
    vi.mocked(loginRequest).mockResolvedValue({ accessToken: 'a1', refreshToken: 'r1' })
    vi.mocked(meRequest).mockResolvedValue(user)
    const store = useAuthStore()

    await store.login('ada@fish.dev', 'secret')

    expect(store.status).toBe('authenticated')
    expect(store.user?.name).toBe('Ada')
    expect(JSON.parse(localStorage.getItem('fish-admin:session') ?? '{}')).toEqual({
      state: { accessToken: 'a1', refreshToken: 'r1' },
      version: 1,
    })
    expect(isMfaRequired({ accessToken: 'x', refreshToken: 'y' })).toBe(false)
  })

  it('returns the MFA challenge without a session', async () => {
    vi.mocked(loginRequest).mockResolvedValue({
      mfaRequired: true,
      challengeId: 'c1',
      expiresAt: '2026-11-11T00:00:00.000Z',
    })
    const store = useAuthStore()

    await expect(store.login('ada@fish.dev', 'secret')).resolves.toEqual({
      status: 'mfa',
      challengeId: 'c1',
      email: 'ada@fish.dev',
    })
    expect(store.status).toBe('anonymous')
    expect(store.accessToken).toBeNull()
    expect(meRequest).not.toHaveBeenCalled()
  })

  it('clears the session when login fails', async () => {
    vi.mocked(loginRequest).mockRejectedValue(new ApiError(401, 'INVALID_CREDENTIALS', 'nope'))
    const store = useAuthStore()
    await expect(store.login('a@b.c', 'x')).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' })
    expect(store.status).toBe('anonymous')
    expect(store.accessToken).toBeNull()
  })

  it('restores a cached access token on bootstrap', async () => {
    localStorage.setItem(
      'fish-admin:session',
      JSON.stringify({
        state: { accessToken: 'cached', refreshToken: 'r1' },
        version: 1,
      }),
    )
    vi.mocked(meRequest).mockResolvedValue(user)
    const store = useAuthStore()

    await store.bootstrap()

    expect(store.status).toBe('authenticated')
    expect(meRequest).toHaveBeenCalledWith('cached')
  })

  it('shares one refresh request between concurrent callers', async () => {
    localStorage.setItem(
      'fish-admin:session',
      JSON.stringify({
        state: { accessToken: 'old', refreshToken: 'r1' },
        version: 1,
      }),
    )
    let resolve!: (value: { accessToken: string; refreshToken: string }) => void
    vi.mocked(refreshRequest).mockReturnValue(
      new Promise((done) => {
        resolve = done
      }),
    )
    const store = useAuthStore()

    const first = store.refreshSession()
    const second = store.refreshSession()
    resolve({ accessToken: 'new', refreshToken: 'r2' })

    await expect(Promise.all([first, second])).resolves.toEqual([true, true])
    expect(refreshRequest).toHaveBeenCalledTimes(1)
    expect(store.accessToken).toBe('new')
  })

  it('logs out locally even when the network call fails', async () => {
    vi.mocked(loginRequest).mockResolvedValue({ accessToken: 'a1', refreshToken: 'r1' })
    vi.mocked(meRequest).mockResolvedValue(user)
    vi.mocked(logoutRequest).mockRejectedValue(new Error('offline'))
    const clear = vi.spyOn(queryClient, 'clear')
    const store = useAuthStore()
    await store.login('ada@fish.dev', 'secret')

    await store.logout()

    expect(store.status).toBe('anonymous')
    expect(store.accessToken).toBeNull()
    expect(clear).toHaveBeenCalled()
  })
})
