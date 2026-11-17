import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Trend from './Trend.vue'

describe('Trend', () => {
  it('renders a positive delta as success with its label', () => {
    const wrapper = mount(Trend, { props: { value: 4.2, label: 'vs last month' } })

    expect(wrapper.find('[data-slot="trend"]').classes()).toContain('text-success')
    expect(wrapper.text()).toContain('+4.2%')
    expect(wrapper.text()).toContain('vs last month')
    expect(wrapper.find('[role="img"]').attributes('aria-label')).toBe('+4.2% vs last month')
  })

  it('flips the tone for inverted metrics', () => {
    const wrapper = mount(Trend, { props: { value: 3, invert: true } })
    expect(wrapper.find('[data-slot="trend"]').classes()).toContain('text-destructive')
  })

  it('renders zero as flat and muted', () => {
    const wrapper = mount(Trend, { props: { value: 0 } })
    expect(wrapper.find('[data-slot="trend"]').classes()).toContain('text-muted-foreground')
    expect(wrapper.text()).toContain('0%')
  })
})
