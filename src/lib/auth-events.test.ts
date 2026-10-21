import { describe, expect, it, vi } from 'vitest'

import { notifyUnauthorized, setUnauthorizedHandler } from '@/lib/auth-events'

describe('auth events', () => {
  it('notifies the registered handler', () => {
    const handler = vi.fn()
    setUnauthorizedHandler(handler)

    notifyUnauthorized()

    expect(handler).toHaveBeenCalledOnce()
  })
})
