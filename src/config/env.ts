// Imported by the api client, so this module ships in the first-paint graph:
// validate by hand instead of pulling in the zod schemas the rest of the app uses.
function readNumber(
  label: string,
  value: string | undefined,
  min: number,
  max: number,
  fallback: number,
) {
  if (value === undefined || value.trim() === '') return fallback

  const parsed = Number(value.trim())
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`Invalid ${label}="${value}" — expected an integer between ${min} and ${max}.`)
  }

  return parsed
}

function readBoolean(label: string, value: string | undefined, fallback: boolean) {
  if (value === undefined || value.trim() === '') return fallback

  const normalized = value.trim()
  if (normalized !== 'true' && normalized !== 'false') {
    throw new Error(`Invalid ${label}="${value}" — expected "true" or "false".`)
  }

  return normalized === 'true'
}

// Unset variables keep their documented default so a bare clone and the test
// runner behave predictably; a set-but-unparseable variable fails at startup
// instead of silently falling back.
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const apiBaseUrl = (rawBaseUrl ? rawBaseUrl : '/api').replace(/\/+$/, '')

export const env = {
  apiBaseUrl,
  // `MODE` rather than `DEV` keeps the test runner on the safe default: Vitest
  // reports `DEV === true` while `MODE === 'test'`.
  enableMock: readBoolean(
    'VITE_ENABLE_MOCK',
    import.meta.env.VITE_ENABLE_MOCK,
    import.meta.env.MODE === 'development',
  ),
  mockLatency: readNumber('VITE_MOCK_LATENCY', import.meta.env.VITE_MOCK_LATENCY, 0, 60_000, 300),
  requestTimeout: readNumber(
    'VITE_REQUEST_TIMEOUT',
    import.meta.env.VITE_REQUEST_TIMEOUT,
    1_000,
    300_000,
    15_000,
  ),
  uploadTimeout: readNumber(
    'VITE_UPLOAD_TIMEOUT',
    import.meta.env.VITE_UPLOAD_TIMEOUT,
    1_000,
    600_000,
    60_000,
  ),
} as const
