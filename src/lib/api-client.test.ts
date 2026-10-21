import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { refreshRequest } from '@/features/auth/api'
import { ApiError } from '@/lib/api-error'
import { apiRequest } from '@/lib/api-client'
import { notifyUnauthorized } from '@/lib/auth-events'
import { useAuthStore } from '@/stores/auth-store'

vi.mock('@/features/auth/api', () => ({
  loginRequest: vi.fn(),
  logoutRequest: vi.fn(),
  meRequest: vi.fn(),
  refreshRequest: vi.fn(),
}))

vi.mock('@/lib/auth-events', () => ({
  notifyUnauthorized: vi.fn(),
}))

const fetchMock = vi.fn<typeof fetch>()

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('apiRequest', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    localStorage.clear()
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      status: 'idle',
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('attaches the bearer token and parses JSON', async () => {
    useAuthStore.setState({ accessToken: 'token-1' })
    fetchMock.mockResolvedValue(jsonResponse({ items: [] }))

    await expect(apiRequest('/users')).resolves.toEqual({ items: [] })

    const [, init] = fetchMock.mock.calls[0]
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer token-1' })
  })

  it('skips auth for public calls', async () => {
    useAuthStore.setState({ accessToken: 'token-1' })
    fetchMock.mockResolvedValue(jsonResponse({}))

    await apiRequest('/public', { auth: false })

    const [, init] = fetchMock.mock.calls[0]
    expect(init?.headers).not.toHaveProperty('Authorization')
  })

  it('serializes a JSON body', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}))
    useAuthStore.setState({ accessToken: 'token-1' })

    await apiRequest('/users', { method: 'POST', body: { name: 'Ada' } })

    const [, init] = fetchMock.mock.calls[0]
    expect(init?.body).toBe(JSON.stringify({ name: 'Ada' }))
    expect(init?.headers).toMatchObject({ 'Content-Type': 'application/json' })
  })

  it('returns undefined for 204 responses', async () => {
    useAuthStore.setState({ accessToken: 'token-1' })
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))

    await expect(apiRequest('/users/1', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it('surfaces API errors with their code', async () => {
    useAuthStore.setState({ accessToken: 'token-1' })
    fetchMock.mockResolvedValue(
      jsonResponse({ code: 'FORBIDDEN', message: 'Missing permission' }, 403),
    )

    await expect(apiRequest('/users')).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
      message: 'Missing permission',
    })
  })

  it('refreshes once and retries after a 401', async () => {
    useAuthStore.setState({ accessToken: 'expired', refreshToken: 'refresh-1' })
    vi.mocked(refreshRequest).mockResolvedValue({
      accessToken: 'token-2',
      refreshToken: 'refresh-2',
    })
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ code: 'TOKEN_EXPIRED' }, 401))
      .mockResolvedValueOnce(jsonResponse({ items: ['ok'] }))

    await expect(apiRequest('/users')).resolves.toEqual({ items: ['ok'] })

    expect(refreshRequest).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[1][1]?.headers).toMatchObject({
      Authorization: 'Bearer token-2',
    })
  })

  it('does not retry a second time when the refreshed token is rejected', async () => {
    useAuthStore.setState({ accessToken: 'expired', refreshToken: 'refresh-1' })
    vi.mocked(refreshRequest).mockResolvedValue({
      accessToken: 'token-2',
      refreshToken: 'refresh-2',
    })
    fetchMock.mockResolvedValue(jsonResponse({ code: 'TOKEN_EXPIRED' }, 401))

    await expect(apiRequest('/users')).rejects.toBeInstanceOf(ApiError)

    expect(refreshRequest).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(notifyUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('clears the session when the refresh fails', async () => {
    useAuthStore.setState({
      user: null,
      accessToken: 'expired',
      refreshToken: 'refresh-1',
      status: 'authenticated',
    })
    vi.mocked(refreshRequest).mockRejectedValue(new Error('invalid refresh token'))
    fetchMock.mockResolvedValue(
      jsonResponse({ code: 'TOKEN_EXPIRED', message: 'Session expired' }, 401),
    )

    await expect(apiRequest('/users')).rejects.toMatchObject({ status: 401 })

    expect(useAuthStore.getState()).toMatchObject({
      accessToken: null,
      refreshToken: null,
      status: 'anonymous',
    })
    expect(notifyUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('does not refresh public endpoints', async () => {
    useAuthStore.setState({ accessToken: 'expired', refreshToken: 'refresh-1' })
    fetchMock.mockResolvedValue(jsonResponse({ code: 'UNAUTHORIZED' }, 401))

    await expect(apiRequest('/login', { auth: false })).rejects.toMatchObject({ status: 401 })

    expect(refreshRequest).not.toHaveBeenCalled()
  })
})
