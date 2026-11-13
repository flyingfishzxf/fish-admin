import { effectScope } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useTransientMessage } from './use-transient-message'

describe('useTransientMessage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('clears the message after the timeout', () => {
    const scope = effectScope()
    const api = scope.run(() => useTransientMessage(3000))!

    api.show('Permissions saved.')
    expect(api.message.value).toBe('Permissions saved.')

    vi.advanceTimersByTime(2999)
    expect(api.message.value).toBe('Permissions saved.')

    vi.advanceTimersByTime(1)
    expect(api.message.value).toBeNull()
    scope.stop()
  })

  it('keeps only the latest message and restarts the timer', () => {
    const scope = effectScope()
    const api = scope.run(() => useTransientMessage(1000))!

    api.show('First')
    vi.advanceTimersByTime(800)
    api.show('Second')
    vi.advanceTimersByTime(800)

    expect(api.message.value).toBe('Second')

    vi.advanceTimersByTime(200)
    expect(api.message.value).toBeNull()
    scope.stop()
  })

  it('stops writing after the scope is disposed', () => {
    const scope = effectScope()
    const api = scope.run(() => useTransientMessage(1000))!

    api.show('Saved')
    scope.stop()
    vi.advanceTimersByTime(1000)

    // The pending timer was cancelled on dispose, so nothing rewrites the value.
    expect(api.message.value).toBe('Saved')
  })
})
