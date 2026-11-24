import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import { toast } from '../../lib/toast'
import Toaster from './Toaster.vue'

const toasterId = 'toaster-test'

describe('Toaster', () => {
  afterEach(() => {
    toast.dismiss(undefined, toasterId)
    document.body.innerHTML = ''
  })

  it('runs the enter transition on new toasts', async () => {
    const wrapper = mount(Toaster, {
      props: { toasterId },
      attachTo: document.body,
      global: { stubs: { transition: false, 'transition-group': false } },
    })
    toast.success('Saved', { toasterId, duration: 0 })
    await wrapper.vm.$nextTick()

    const item = document.body.querySelector('[data-slot="toast"]')
    expect(item).not.toBeNull()
    expect(item?.getAttribute('data-tone')).toBe('success')
    expect(item?.className).toContain('toast-bottom-enter-active')
    wrapper.unmount()
  })

  it('keeps the stack anchored to the chosen corner', () => {
    const wrapper = mount(Toaster, {
      props: { toasterId, position: 'top-left' },
      attachTo: document.body,
    })
    const stack = document.body.querySelector('[data-slot="toaster"]')
    expect(stack?.className).toContain('top-4 left-4 items-start')
    wrapper.unmount()
  })
})
