import { beforeEach, describe, expect, it, vi } from 'vitest'

import { loginRequest, logoutRequest, meRequest, refreshRequest } from '@/features/auth/api'
import { useAuthStore } from '@/stores/auth-store'
import type { AuthUser } from '@/types'

vi.mock('@/features/auth/api', () => ({
  loginRequest: vi.fn(),
  logoutRequest: vi.fn(),
  meRequest: vi.fn(),
  refreshRequest: vi.fn(),
  verifyMfaRequest: vi.fn(),
  isMfaRequired: (result: unknown) =>
    typeof result === 'object' && result !== null && 'mfaRequired' in result,
}))

const tokens = { accessToken: 'access-1', refreshToken: 'refresh-1' }

const manager: AuthUser = {
  id: 'user_manager',
  name: 'Maya Chen',
  email: 'manager@fish.dev',
  roleId: 'role_manager',
  roleName: 'Manager',
  permissions: ['user:read', 'user:create'],
  emailVerified: true,
  twoFactorEnabled: false,
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

describe('auth store', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      status: 'idle',
    })
  })

  it('logs in and loads the current user', async () => {
    vi.mocked(loginRequest).mockResolvedValue(tokens)
    vi.mocked(meRequest).mockResolvedValue(manager)

    await useAuthStore.getState().login('manager@fish.dev', 'Manager123!')

    expect(useAuthStore.getState()).toMatchObject({
      user: manager,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      status: 'authenticated',
    })
    expect(meRequest).toHaveBeenCalledWith(tokens.accessToken)
  })

  it('clears the session when login fails', async () => {
    vi.mocked(loginRequest).mockRejectedValue(new Error('invalid credentials'))

    await expect(useAuthStore.getState().login('manager@fish.dev', 'wrong')).rejects.toThrow(
      'invalid credentials',
    )

    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      accessToken: null,
      refreshToken: null,
      status: 'anonymous',
    })
  })

  it('clears the session and revokes the refresh token on logout', async () => {
    vi.mocked(logoutRequest).mockResolvedValue()
    useAuthStore.setState({
      user: manager,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      status: 'authenticated',
    })

    await useAuthStore.getState().logout()

    expect(logoutRequest).toHaveBeenCalledWith(tokens.refreshToken)
    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      accessToken: null,
      refreshToken: null,
      status: 'anonymous',
    })
  })

  it('still signs out locally when revoking the token fails', async () => {
    vi.mocked(logoutRequest).mockRejectedValue(new Error('offline'))
    useAuthStore.setState({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      status: 'authenticated',
    })

    await expect(useAuthStore.getState().logout()).resolves.toBeUndefined()
    expect(useAuthStore.getState().status).toBe('anonymous')
  })

  it('boots as anonymous without a refresh token', async () => {
    await useAuthStore.getState().bootstrap()

    expect(useAuthStore.getState().status).toBe('anonymous')
    expect(refreshRequest).not.toHaveBeenCalled()
    expect(meRequest).not.toHaveBeenCalled()
  })

  it('restores the user from a cached access token without refreshing', async () => {
    useAuthStore.setState({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    })
    vi.mocked(meRequest).mockResolvedValue(manager)

    await useAuthStore.getState().bootstrap()

    expect(meRequest).toHaveBeenCalledWith(tokens.accessToken)
    expect(refreshRequest).not.toHaveBeenCalled()
    expect(useAuthStore.getState()).toMatchObject({ user: manager, status: 'authenticated' })
  })

  it('falls back to a refresh when the cached access token is rejected', async () => {
    useAuthStore.setState({
      accessToken: 'expired',
      refreshToken: tokens.refreshToken,
    })
    vi.mocked(meRequest)
      .mockRejectedValueOnce(new Error('TOKEN_EXPIRED'))
      .mockResolvedValue(manager)
    vi.mocked(refreshRequest).mockResolvedValue({
      accessToken: 'access-2',
      refreshToken: 'refresh-2',
    })

    await useAuthStore.getState().bootstrap()

    expect(refreshRequest).toHaveBeenCalledWith(tokens.refreshToken)
    expect(meRequest).toHaveBeenLastCalledWith('access-2')
    expect(useAuthStore.getState()).toMatchObject({ user: manager, status: 'authenticated' })
  })

  it('refreshes the token and restores the user on boot', async () => {
    useAuthStore.setState({ refreshToken: tokens.refreshToken })
    vi.mocked(refreshRequest).mockResolvedValue({
      accessToken: 'access-2',
      refreshToken: 'refresh-2',
    })
    vi.mocked(meRequest).mockResolvedValue(manager)

    await useAuthStore.getState().bootstrap()

    expect(useAuthStore.getState()).toMatchObject({
      user: manager,
      accessToken: 'access-2',
      refreshToken: 'refresh-2',
      status: 'authenticated',
    })
  })

  it('boots as anonymous when the refresh token is rejected', async () => {
    useAuthStore.setState({ refreshToken: tokens.refreshToken })
    vi.mocked(refreshRequest).mockRejectedValue(new Error('expired'))
    vi.mocked(meRequest).mockResolvedValue(manager)

    await useAuthStore.getState().bootstrap()

    expect(meRequest).not.toHaveBeenCalled()
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: null,
      refreshToken: null,
      status: 'anonymous',
    })
  })

  it('shares one refresh request between concurrent callers', async () => {
    const pending = deferred<{ accessToken: string; refreshToken: string }>()
    vi.mocked(refreshRequest).mockReturnValue(pending.promise)
    useAuthStore.setState({ refreshToken: tokens.refreshToken })

    const first = useAuthStore.getState().refreshSession()
    const second = useAuthStore.getState().refreshSession()

    expect(refreshRequest).toHaveBeenCalledTimes(1)

    pending.resolve({ accessToken: 'access-2', refreshToken: 'refresh-2' })

    await expect(first).resolves.toBe(true)
    await expect(second).resolves.toBe(true)
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: 'access-2',
      refreshToken: 'refresh-2',
    })
  })

  it('shares one bootstrap between concurrent callers', async () => {
    const pending = deferred<{ accessToken: string; refreshToken: string }>()
    vi.mocked(refreshRequest).mockReturnValue(pending.promise)
    vi.mocked(meRequest).mockResolvedValue(manager)
    useAuthStore.setState({ refreshToken: tokens.refreshToken })

    const first = useAuthStore.getState().bootstrap()
    const second = useAuthStore.getState().bootstrap()

    expect(refreshRequest).toHaveBeenCalledTimes(1)

    pending.resolve({ accessToken: 'access-2', refreshToken: 'refresh-2' })
    await Promise.all([first, second])

    expect(meRequest).toHaveBeenCalledTimes(1)
    expect(useAuthStore.getState().status).toBe('authenticated')
  })

  it('returns false without a refresh token', async () => {
    await expect(useAuthStore.getState().refreshSession()).resolves.toBe(false)
    expect(refreshRequest).not.toHaveBeenCalled()
  })

  it('drops the tokens when a refresh fails', async () => {
    useAuthStore.setState({
      accessToken: 'expired',
      refreshToken: tokens.refreshToken,
      status: 'authenticated',
    })
    vi.mocked(refreshRequest).mockRejectedValue(new Error('invalid refresh token'))

    await expect(useAuthStore.getState().refreshSession()).resolves.toBe(false)

    expect(useAuthStore.getState()).toMatchObject({
      accessToken: null,
      refreshToken: null,
    })
  })

  it('refreshes and retries when loading the user fails', async () => {
    useAuthStore.setState({
      user: manager,
      accessToken: 'expired',
      refreshToken: tokens.refreshToken,
      status: 'authenticated',
    })
    vi.mocked(meRequest)
      .mockRejectedValueOnce(new Error('401'))
      .mockResolvedValueOnce({ ...manager, roleName: 'Manager (updated)' })
    vi.mocked(refreshRequest).mockResolvedValue({
      accessToken: 'access-2',
      refreshToken: 'refresh-2',
    })

    await useAuthStore.getState().refreshUser()

    expect(meRequest).toHaveBeenNthCalledWith(1, 'expired')
    expect(meRequest).toHaveBeenNthCalledWith(2, 'access-2')
    expect(useAuthStore.getState().user?.roleName).toBe('Manager (updated)')
  })

  it('keeps the current user when both attempts fail', async () => {
    useAuthStore.setState({
      user: manager,
      accessToken: 'expired',
      refreshToken: tokens.refreshToken,
      status: 'authenticated',
    })
    vi.mocked(meRequest).mockRejectedValue(new Error('401'))
    vi.mocked(refreshRequest).mockRejectedValue(new Error('expired'))

    await useAuthStore.getState().refreshUser()

    expect(useAuthStore.getState().user).toEqual(manager)
  })

  it('merges partial user updates', () => {
    useAuthStore.setState({ user: manager, status: 'authenticated' })

    useAuthStore.getState().updateUser({ name: 'Maya C.', avatar: 'avatar.png' })

    expect(useAuthStore.getState().user).toEqual({
      ...manager,
      name: 'Maya C.',
      avatar: 'avatar.png',
    })
  })

  it('clears the session without calling the API', () => {
    useAuthStore.setState({
      user: manager,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      status: 'authenticated',
    })

    useAuthStore.getState().clearSession()

    expect(logoutRequest).not.toHaveBeenCalled()
    expect(useAuthStore.getState().status).toBe('anonymous')
  })
})
