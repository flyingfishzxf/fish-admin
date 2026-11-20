import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ProgressBar from './ProgressBar.vue'

describe('ProgressBar', () => {
  it('mirrors the value onto the progressbar role', () => {
    const wrapper = mount(ProgressBar, { props: { value: 72, ariaLabel: 'Storage used' } })

    const bar = wrapper.find('[role="progressbar"]')
    expect(bar.exists()).toBe(true)
    expect(bar.attributes('aria-label')).toBe('Storage used')
    expect(bar.attributes('aria-valuenow')).toBe('72')
    expect(bar.attributes('aria-valuemin')).toBe('0')
    expect(bar.attributes('aria-valuemax')).toBe('100')
  })

  it('clamps out-of-range values', () => {
    const high = mount(ProgressBar, { props: { value: 130, ariaLabel: 'Usage' } })
    expect(high.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('100')

    const low = mount(ProgressBar, { props: { value: -20, ariaLabel: 'Usage' } })
    expect(low.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('0')
  })

  it('switches the fill tone', () => {
    const warn = mount(ProgressBar, {
      props: { value: 96, ariaLabel: 'Seat usage', tone: 'warning' },
    })
    const warnFill = warn.find('[role="progressbar"] > div')
    expect(warnFill.classes()).toContain('bg-destructive')
    expect(warnFill.attributes('style')).toContain('width: 96%')

    const normal = mount(ProgressBar, { props: { value: 40, ariaLabel: 'Storage used' } })
    expect(normal.find('[role="progressbar"] > div').classes()).toContain('bg-primary')
  })
})
