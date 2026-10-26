import { afterEach, describe, expect, it, vi } from 'vitest'

async function loadEnv() {
  vi.resetModules()
  const module = await import('./env')
  return module.env
}

describe('startup environment', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('keeps the documented defaults when nothing is set', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    vi.stubEnv('VITE_ENABLE_MOCK', '')
    vi.stubEnv('VITE_MOCK_LATENCY', '')
    vi.stubEnv('VITE_REQUEST_TIMEOUT', '')
    vi.stubEnv('VITE_UPLOAD_TIMEOUT', '')

    await expect(loadEnv()).resolves.toEqual({
      apiBaseUrl: '/api',
      enableMock: false,
      mockLatency: 300,
      requestTimeout: 15_000,
      uploadTimeout: 60_000,
    })
  })

  it('trims the API base and drops its trailing slash', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '  https://api.example.com/v1/  ')

    await expect(loadEnv()).resolves.toMatchObject({
      apiBaseUrl: 'https://api.example.com/v1',
    })
  })

  it('reads a boolean mock flag and a numeric timeout', async () => {
    vi.stubEnv('VITE_ENABLE_MOCK', 'true')
    vi.stubEnv('VITE_MOCK_LATENCY', '0')
    vi.stubEnv('VITE_REQUEST_TIMEOUT', ' 45000 ')

    await expect(loadEnv()).resolves.toMatchObject({
      enableMock: true,
      mockLatency: 0,
      requestTimeout: 45_000,
    })
  })

  it('rejects an out-of-range or malformed timeout at startup', async () => {
    vi.stubEnv('VITE_REQUEST_TIMEOUT', '999')
    await expect(loadEnv()).rejects.toThrow(/VITE_REQUEST_TIMEOUT="999"/)

    vi.stubEnv('VITE_REQUEST_TIMEOUT', 'soon')
    await expect(loadEnv()).rejects.toThrow(/expected an integer between 1000 and 300000/)
  })

  it('rejects a mock flag that is neither true nor false', async () => {
    vi.stubEnv('VITE_ENABLE_MOCK', 'yes')

    await expect(loadEnv()).rejects.toThrow(/VITE_ENABLE_MOCK="yes" — expected "true" or "false"/)
  })
})
