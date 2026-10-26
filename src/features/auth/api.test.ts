import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/lib/api-error'

const { apiRequestMock } = vi.hoisted(() => ({ apiRequestMock: vi.fn() }))

vi.mock('@/lib/api-client', () => ({ apiRequest: apiRequestMock }))

import {
  acceptInviteRequest,
  changePasswordRequest,
  disableTwoFactorRequest,
  enableTwoFactorRequest,
  forgotPasswordRequest,
  getInviteRequest,
  getSessionsRequest,
  isMfaRequired,
  loginRequest,
  logoutRequest,
  meRequest,
  refreshRequest,
  registerRequest,
  resetPasswordRequest,
  revokeOtherSessionsRequest,
  revokeSessionRequest,
  setupTwoFactorRequest,
  verifyEmailRequest,
  verifyMfaRequest,
} from '@/features/auth/api'

const publicCall = { auth: false } as const

describe('auth api', () => {
  beforeEach(() => {
    apiRequestMock.mockReset()
    apiRequestMock.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' })
  })

  it('posts credentials to the login endpoint without session handling', async () => {
    await loginRequest('admin@fish.dev', 'Admin123!')

    expect(apiRequestMock).toHaveBeenCalledWith('/auth/login', {
      method: 'POST',
      body: { email: 'admin@fish.dev', password: 'Admin123!' },
      ...publicCall,
    })
  })

  it('posts the challenge and code to mfa/verify', async () => {
    await verifyMfaRequest('mfa_1', '246810')

    expect(apiRequestMock).toHaveBeenCalledWith('/auth/mfa/verify', {
      method: 'POST',
      body: { challengeId: 'mfa_1', code: '246810' },
      ...publicCall,
    })
  })

  it('sends register, verify-email and forgot-password payloads', async () => {
    await registerRequest({ name: 'Ada', email: 'ada@fish.dev', password: 'Passw0rd!' })
    await verifyEmailRequest('vtoken')
    await forgotPasswordRequest('ada@fish.dev')

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, '/auth/register', {
      method: 'POST',
      body: { name: 'Ada', email: 'ada@fish.dev', password: 'Passw0rd!' },
      ...publicCall,
    })
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, '/auth/verify-email', {
      method: 'POST',
      body: { token: 'vtoken' },
      ...publicCall,
    })
    expect(apiRequestMock).toHaveBeenNthCalledWith(3, '/auth/forgot-password', {
      method: 'POST',
      body: { email: 'ada@fish.dev' },
      ...publicCall,
    })
  })

  it('posts reset-password through the shared client', async () => {
    await resetPasswordRequest({ token: 'rt', password: 'Passw0rd!' })

    expect(apiRequestMock).toHaveBeenCalledWith('/auth/reset-password', {
      method: 'POST',
      body: { token: 'rt', password: 'Passw0rd!' },
      ...publicCall,
    })
  })

  it('sends an explicit bearer for /auth/me and opts out of refresh', async () => {
    await meRequest('atoken')

    expect(apiRequestMock).toHaveBeenCalledWith('/auth/me', {
      token: 'atoken',
      ...publicCall,
    })
  })

  it('encodes the invite token in the path and forwards the abort signal', async () => {
    const controller = new AbortController()

    await getInviteRequest('a b/c', controller.signal)
    expect(apiRequestMock).toHaveBeenNthCalledWith(1, '/auth/invites/a%20b%2Fc', {
      signal: controller.signal,
      ...publicCall,
    })

    await acceptInviteRequest({ token: 'a b/c', name: 'Ada', email: 'a@b.c', password: 'p' })
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, '/auth/accept-invite', {
      method: 'POST',
      body: { token: 'a b/c', name: 'Ada', email: 'a@b.c', password: 'p' },
      ...publicCall,
    })
  })

  it('never lets refresh or logout re-enter the refresh path', async () => {
    await refreshRequest('rtoken')
    await logoutRequest('rtoken')

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, '/auth/refresh', {
      method: 'POST',
      body: { refreshToken: 'rtoken' },
      ...publicCall,
    })
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, '/auth/logout', {
      method: 'POST',
      body: { refreshToken: 'rtoken' },
      ...publicCall,
    })
  })

  it('surfaces an ApiError from the shared client', async () => {
    apiRequestMock.mockRejectedValue(new ApiError(429, 'ACCOUNT_LOCKED', 'Try later'))

    await expect(loginRequest('admin@fish.dev', 'nope')).rejects.toMatchObject({
      status: 429,
      code: 'ACCOUNT_LOCKED',
      message: 'Try later',
    })
  })

  it('detects an mfa challenge', () => {
    expect(isMfaRequired({ mfaRequired: true, challengeId: 'c', expiresAt: 'later' })).toBe(true)
    expect(isMfaRequired({ accessToken: 'a', refreshToken: 'r' })).toBe(false)
  })

  it('routes session and two-factor calls through the authenticated client', async () => {
    const controller = new AbortController()

    await changePasswordRequest('old', 'new')
    await getSessionsRequest(controller.signal)
    await revokeSessionRequest('sess_1')
    await revokeOtherSessionsRequest()
    await setupTwoFactorRequest()
    await enableTwoFactorRequest('246810')
    await disableTwoFactorRequest('Admin123!')

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, '/auth/change-password', {
      method: 'POST',
      body: { currentPassword: 'old', newPassword: 'new' },
    })
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, '/auth/sessions', {
      signal: controller.signal,
    })
    expect(apiRequestMock).toHaveBeenNthCalledWith(3, '/auth/sessions/sess_1', { method: 'DELETE' })
    expect(apiRequestMock).toHaveBeenNthCalledWith(4, '/auth/sessions', { method: 'DELETE' })
    expect(apiRequestMock).toHaveBeenNthCalledWith(5, '/auth/2fa/setup', { method: 'POST' })
    expect(apiRequestMock).toHaveBeenNthCalledWith(6, '/auth/2fa/enable', {
      method: 'POST',
      body: { code: '246810' },
    })
    expect(apiRequestMock).toHaveBeenNthCalledWith(7, '/auth/2fa/disable', {
      method: 'POST',
      body: { password: 'Admin123!' },
    })
  })
})
