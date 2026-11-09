import { setupWorker } from 'msw/browser'

import { configureMock, type MockRuntimeOptions } from './runtime'

/**
 * Handlers are imported after `configureMock` so their module-level
 * `const API = mockApiUrl()` sees the configured base URL.
 */
export async function createMockWorker(options: MockRuntimeOptions) {
  configureMock(options)
  const { handlers } = await import('./handlers')
  return setupWorker(...handlers)
}
