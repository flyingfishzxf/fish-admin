import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { env } from '@/config/env'
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

interface FakeResponse {
  ok: boolean
  status: number
  statusText: string
  json: () => Promise<unknown>
}

const fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<FakeResponse>>()

function okResponse(body: unknown): FakeResponse {
  return { ok: true, status: 200, statusText: 'OK', json: async () => body }
}

function respond(response: FakeResponse) {
  fetchMock.mockResolvedValueOnce(response)
}

function sent(index = 0) {
  const [url, init] = fetchMock.mock.calls[index]
  return { url, init }
}

function body(index = 0) {
  return JSON.parse(sent(index).init.body as string)
}

describe('auth api', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    fetchMock.mockImplementation(async () => okResponse({ accessToken: 'a', refreshToken: 'r' }))
    apiRequestMock.mockReset()
    apiRequestMock.mockResolvedValue(undefined)
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('posts credentials to the login endpoint', async () => {
    await loginRequest('admin@fish.dev', 'Admin123!')

    const { url, init } = sent()
    expect(url).toBe(`${env.apiBaseUrl}/auth/login`)
    expect(init.method).toBe('POST')
    expect(body()).toEqual({ email: 'admin@fish.dev', password: 'Admin123!' })
    expect(new Headers(init.headers).get('content-type')).toBe('application/json')
  })

  it('posts the challenge and code to mfa/verify', async () => {
    await verifyMfaRequest('mfa_1', '246810')

    expect(sent().url).toBe(`${env.apiBaseUrl}/auth/mfa/verify`)
    expect(body()).toEqual({ challengeId: 'mfa_1', code: '246810' })
  })

  it('sends register, verify-email and forgot-password payloads', async () => {
    await registerRequest({ name: 'Ada', email: 'ada@fish.dev', password: 'Passw0rd!' })
    await verifyEmailRequest('vtoken')
    await forgotPasswordRequest('ada@fish.dev')

    expect(sent(0).url).toBe(`${env.apiBaseUrl}/auth/register`)
    expect(body(0)).toEqual({ name: 'Ada', email: 'ada@fish.dev', password: 'Passw0rd!' })
    expect(body(1)).toEqual({ token: 'vtoken' })
    expect(body(2)).toEqual({ email: 'ada@fish.dev' })
  })

  it('treats a 204 reset response as success without reading a body', async () => {
    respond({
      ok: true,
      status: 204,
      statusText: 'No Content',
      json: async () => {
        throw new Error('body should not be read')
      },
    })

    await expect(
      resetPasswordRequest({ token: 'rt', password: 'Passw0rd!' }),
    ).resolves.toBeUndefined()
    expect(body()).toEqual({ token: 'rt', password: 'Passw0rd!' })
  })

  it('sends a bearer token for /auth/me and no content-type', async () => {
    respond(okResponse({ id: 'user_1' }))

    await expect(meRequest('atoken')).resolves.toEqual({ id: 'user_1' })

    const headers = new Headers(sent().init.headers)
    expect(headers.get('authorization')).toBe('Bearer atoken')
    expect(headers.get('content-type')).toBeNull()
  })

  it('encodes the invite token in the path', async () => {
    respond(okResponse({ email: 'ada@fish.dev' }))

    await getInviteRequest('a b/c')
    expect(sent().url).toBe(`${env.apiBaseUrl}/auth/invites/a%20b%2Fc`)

    await acceptInviteRequest({ token: 'a b/c', name: 'Ada', email: 'a@b.c', password: 'p' })
    expect(sent(1).url).toBe(`${env.apiBaseUrl}/auth/accept-invite`)
  })

  it('posts refresh tokens and surfaces logout failures', async () => {
    await refreshRequest('rtoken')
    expect(body()).toEqual({ refreshToken: 'rtoken' })

    respond({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ code: 'INVALID_REFRESH_TOKEN', message: 'gone' }),
    })
    await expect(logoutRequest('rtoken')).rejects.toMatchObject({ status: 401 })
  })

  it('maps error payloads onto ApiError', async () => {
    respond({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      json: async () => ({ code: 'ACCOUNT_LOCKED', message: 'Try later' }),
    })

    const error = await loginRequest('admin@fish.dev', 'nope').catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 429, code: 'ACCOUNT_LOCKED', message: 'Try later' })
  })

  it('falls back to REQUEST_FAILED when the error body is unreadable', async () => {
    respond({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      json: async () => {
        throw new Error('not json')
      },
    })

    const error = await registerRequest({
      name: 'Ada',
      email: 'ada@fish.dev',
      password: 'Passw0rd!',
    }).catch((caught: unknown) => caught)
    expect(error).toMatchObject({ status: 500, code: 'REQUEST_FAILED', message: 'Server Error' })
  })

  it('detects an mfa challenge', () => {
    expect(isMfaRequired({ mfaRequired: true, challengeId: 'c', expiresAt: 'later' })).toBe(true)
    expect(isMfaRequired({ accessToken: 'a', refreshToken: 'r' })).toBe(false)
  })

  it('routes session and two-factor calls through the shared client', async () => {
    await changePasswordRequest('old', 'new')
    await getSessionsRequest()
    await revokeSessionRequest('sess_1')
    await revokeOtherSessionsRequest()
    await setupTwoFactorRequest()
    await enableTwoFactorRequest('246810')
    await disableTwoFactorRequest('Admin123!')

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, '/auth/change-password', {
      method: 'POST',
      body: { currentPassword: 'old', newPassword: 'new' },
    })
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, '/auth/sessions')
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
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
