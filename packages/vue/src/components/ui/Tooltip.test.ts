import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import Tooltip from './Tooltip.vue'

describe('Tooltip', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('fades and zooms the content in from the trigger', async () => {
    const wrapper = mount(Tooltip, {
      props: { delayDuration: 0 },
      slots: { trigger: '<button type="button">Hover</button>', default: 'Saves changes' },
      attachTo: document.body,
    })

    await wrapper.find('button').trigger('focus')
    await vi.waitFor(() =>
      expect(document.body.querySelector('[data-slot="tooltip-content"]')).not.toBeNull(),
    )

    const content = document.body.querySelector('[data-slot="tooltip-content"]')
    expect(content?.className).toContain('animate-in')
    expect(content?.className).toContain('fade-in-0')
    expect(content?.className).toContain('zoom-in-95')
    expect(content?.className).toContain('origin-(--reka-tooltip-content-transform-origin)')
    expect(content?.className).toContain('motion-reduce:animate-none!')
    wrapper.unmount()
  })
})
