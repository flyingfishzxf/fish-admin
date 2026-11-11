import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('env', () => {
  it('uses documented defaults', async () => {
    const { env } = await import('./env')
    expect(env.apiBaseUrl).toBe('/api')
    expect(env.mockLatency).toBe(300)
    expect(env.requestTimeout).toBe(15000)
  })

  it('trims a trailing slash and rejects an unparseable timeout', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '/v1/api/')
    const { env } = await import('./env')
    expect(env.apiBaseUrl).toBe('/v1/api')

    vi.resetModules()
    vi.stubEnv('VITE_REQUEST_TIMEOUT', 'soon')
    await expect(import('./env')).rejects.toThrow(/VITE_REQUEST_TIMEOUT/)
  })
})
