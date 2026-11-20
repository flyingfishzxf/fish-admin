import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Watermark from './Watermark.vue'

describe('Watermark', () => {
  it('overlays a decorative canvas above the content', () => {
    const wrapper = mount(Watermark, {
      props: { text: 'CONFIDENTIAL' },
      slots: { default: '<div>Payroll export</div>' },
    })

    const root = wrapper.find('[data-slot="watermark"]')
    expect(root.exists()).toBe(true)
    const canvas = root.find('canvas')
    expect(canvas.exists()).toBe(true)
    expect(canvas.attributes('aria-hidden')).toBe('true')
    expect(canvas.classes()).toContain('pointer-events-none')
    expect(root.text()).toContain('Payroll export')
  })

  it('passes through the wrapper class', () => {
    const wrapper = mount(Watermark, {
      props: { text: 'DRAFT', class: 'min-h-40' },
      slots: { default: '<p>Working copy</p>' },
    })

    expect(wrapper.find('[data-slot="watermark"]').classes()).toContain('min-h-40')
  })

  it('survives prop changes (redraw watcher)', async () => {
    const wrapper = mount(Watermark, {
      props: { text: 'DRAFT' },
      slots: { default: '<p>Content</p>' },
    })

    await wrapper.setProps({ text: 'CONFIDENTIAL', opacity: 0.14 })
    // no crash and the canvas is still in place after a redraw pass
    expect(wrapper.find('canvas').exists()).toBe(true)
  })
})
