import { setupServer } from 'msw/node'

import { configureMock, type MockRuntimeOptions } from './runtime'

export async function createMockServer(options: MockRuntimeOptions) {
  configureMock(options)
  const { handlers } = await import('./handlers')
  return setupServer(...handlers)
}
