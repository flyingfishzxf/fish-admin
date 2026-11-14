import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { i18nReady } from '../../lib/i18n'
import OfflineBanner from './OfflineBanner.vue'

function setOnline(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, value })
}

let wrapper: VueWrapper | null = null

describe('OfflineBanner', () => {
  beforeEach(async () => {
    await i18nReady
    setOnline(true)
  })
  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.body.innerHTML = ''
  })

  it('renders nothing while online', () => {
    wrapper = mount(OfflineBanner)
    expect(wrapper.find('[data-slot="offline-banner"]').exists()).toBe(false)
  })

  it('shows the banner with a retry action once the link drops', async () => {
    wrapper = mount(OfflineBanner)

    setOnline(false)
    window.dispatchEvent(new Event('offline'))
    await wrapper.vm.$nextTick()

    const banner = wrapper.get('[data-slot="offline-banner"]')
    expect(banner.attributes('role')).toBe('status')
    expect(banner.text()).toContain("You're offline")
    expect(banner.text()).toContain('Retry')
  })

  it('reports the recovery once and then retires', async () => {
    wrapper = mount(OfflineBanner)

    setOnline(false)
    window.dispatchEvent(new Event('offline'))
    await wrapper.vm.$nextTick()
    window.dispatchEvent(new Event('online'))
    await wrapper.vm.$nextTick()

    const restored = wrapper.get('[data-slot="offline-restored"]')
    expect(restored.text()).toContain('Connection restored.')
    expect(wrapper.find('[data-slot="offline-banner"]').exists()).toBe(false)
  })
})
