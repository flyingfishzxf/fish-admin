import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './api-error'
import { apiRequest, configureApi } from './api-client'

const onSessionExpired = vi.fn()
const refreshSession = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
  configureApi({ getAccessToken: () => 'token-1', refreshSession, onSessionExpired })
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('apiRequest', () => {
  it('attaches the injected bearer', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('{"ok":true}', { status: 200 }))
    await apiRequest('/users')
    expect(vi.mocked(fetch).mock.calls[0]?.[1]?.headers).toMatchObject({
      Authorization: 'Bearer token-1',
    })
  })

  it('refreshes once on 401 and retries', async () => {
    refreshSession.mockResolvedValue(true)
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response('{}', { status: 401 }))
      .mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 }))
    await expect(apiRequest('/users')).resolves.toEqual({ ok: true })
    expect(refreshSession).toHaveBeenCalledTimes(1)
  })

  it('expires the session when refresh fails', async () => {
    refreshSession.mockResolvedValue(false)
    vi.mocked(fetch).mockResolvedValue(new Response('{"code":"TOKEN_EXPIRED"}', { status: 401 }))
    await expect(apiRequest('/users')).rejects.toBeInstanceOf(ApiError)
    expect(onSessionExpired).toHaveBeenCalled()
  })
})
