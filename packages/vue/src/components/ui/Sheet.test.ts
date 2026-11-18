import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Sheet from './Sheet.vue'

describe('Sheet', () => {
  it('teleports the panel with the side classes and a close button', async () => {
    const wrapper = mount(Sheet, {
      props: { open: true, side: 'left', title: 'Details' },
      slots: { default: '<p>Sheet body</p>' },
      attachTo: document.body,
    })
    await wrapper.vm.$nextTick()

    const content = document.body.querySelector('[data-slot="sheet-content"]')
    expect(content?.className).toContain('left-0')
    expect(document.body.querySelector('[aria-label="Close"]')).not.toBeNull()
    expect(document.body.textContent).toContain('Sheet body')
  })

  it('stays closed and renders the trigger slot', () => {
    const wrapper = mount(Sheet, {
      props: { open: false, side: 'right' },
      slots: { trigger: '<button>Open sheet</button>' },
    })
    expect(wrapper.find('[data-slot="sheet-trigger"]').text()).toContain('Open sheet')
  })
})
