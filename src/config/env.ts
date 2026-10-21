const parsedLatency = Number(import.meta.env.VITE_MOCK_LATENCY ?? 300)

export const env = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, ''),
  enableMock: import.meta.env.VITE_ENABLE_MOCK === 'true',
  mockLatency: Number.isFinite(parsedLatency) ? parsedLatency : 300,
} as const
