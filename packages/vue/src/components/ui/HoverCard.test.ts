import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import HoverCard from './HoverCard.vue'

describe('HoverCard', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('fades and zooms the card in from the trigger', async () => {
    const wrapper = mount(HoverCard, {
      slots: { trigger: '<button type="button">@fish</button>', default: '<p>Maintainer</p>' },
      attachTo: document.body,
    })

    await wrapper.find('button').trigger('focus')
    await vi.waitFor(() =>
      expect(document.body.querySelector('[data-slot="hover-card-content"]')).not.toBeNull(),
    )

    const content = document.body.querySelector('[data-slot="hover-card-content"]')
    expect(content?.className).toContain('data-[state=open]:animate-in')
    expect(content?.className).toContain('data-[state=open]:fade-in-0')
    expect(content?.className).toContain('data-[state=open]:zoom-in-95')
    expect(content?.className).toContain('origin-(--reka-hover-card-content-transform-origin)')
    wrapper.unmount()
  })
})
