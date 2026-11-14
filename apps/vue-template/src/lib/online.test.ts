import { effectScope, type Ref } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'

import { useOnlineStatus } from './online'

function setOnline(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, value })
}

describe('useOnlineStatus', () => {
  afterEach(() => {
    setOnline(true)
  })

  it('starts from navigator.onLine', () => {
    setOnline(false)
    const scope = effectScope()
    const online = scope.run(() => useOnlineStatus()) as Ref<boolean>
    expect(online.value).toBe(false)
    scope.stop()
  })

  it('follows the online and offline events', () => {
    setOnline(true)
    const scope = effectScope()
    const online = scope.run(() => useOnlineStatus()) as Ref<boolean>

    window.dispatchEvent(new Event('offline'))
    expect(online.value).toBe(false)

    window.dispatchEvent(new Event('online'))
    expect(online.value).toBe(true)
    scope.stop()
  })

  it('stops listening once its scope is disposed', () => {
    setOnline(true)
    const scope = effectScope()
    const online = scope.run(() => useOnlineStatus()) as Ref<boolean>
    scope.stop()

    window.dispatchEvent(new Event('offline'))
    expect(online.value).toBe(true)
  })
})
