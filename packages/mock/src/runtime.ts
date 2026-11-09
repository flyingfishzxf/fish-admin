let apiBaseUrl = '/api'
let latency = 0

export interface MockRuntimeOptions {
  apiBaseUrl: string
  latency?: number
}

export function configureMock(options: MockRuntimeOptions) {
  apiBaseUrl = options.apiBaseUrl.replace(/\/+$/, '')
  latency = options.latency ?? 0
}

export function mockApiUrl() {
  return apiBaseUrl
}

export function mockLatency() {
  return latency
}
