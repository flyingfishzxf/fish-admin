import { Wallet } from 'lucide-vue-next'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Statistic from './Statistic.vue'

describe('Statistic', () => {
  it('formats the value and renders prefix, suffix and trend', () => {
    const wrapper = mount(Statistic, {
      props: {
        label: 'Revenue',
        value: 48200.5,
        precision: 2,
        trend: { value: 12.34, label: 'vs last month' },
        icon: Wallet,
      },
      slots: { prefix: '<span>$</span>', suffix: '<span>USD</span>' },
    })

    expect(wrapper.text()).toContain('48,200.50')
    expect(wrapper.text()).toContain('+12.3%')
    expect(wrapper.text()).toContain('vs last month')
    expect(wrapper.find('[aria-label]').attributes('aria-label')).toBe(
      'Revenue +12.3% vs last month',
    )
  })

  it('swaps the value for skeletons while loading', () => {
    const wrapper = mount(Statistic, { props: { label: 'Revenue', value: 1, loading: true } })
    expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
    expect(wrapper.find('h1').exists()).toBe(false)
    expect(wrapper.findAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
  })
})
