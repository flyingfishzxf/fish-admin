import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ChartContainer from './ChartContainer.vue'
import ChartLegendContent from './ChartLegendContent.vue'
import ChartStyle from './ChartStyle.vue'
import ChartTooltipContent from './ChartTooltipContent.vue'
import type { ChartConfig } from './context'

const config: ChartConfig = {
  revenue: { label: 'Revenue', color: 'hsl(142 70% 45%)' },
  cost: { label: 'Cost', theme: { light: 'hsl(0 80% 50%)', dark: 'hsl(0 80% 65%)' } },
}

describe('Chart family', () => {
  it('provides config via context and renders the style variables', () => {
    const wrapper = mount(ChartContainer, {
      props: { config },
      slots: { default: () => h(ChartTooltipContent, { active: true, label: 'Jan' }) },
    })

    expect(wrapper.find('[data-slot="chart"]').attributes('data-chart')).toContain('chart-')
    expect(wrapper.find('[data-slot="chart-style"]').text()).toContain('--color-revenue')
    expect(wrapper.find('[data-slot="chart-style"]').text()).toContain('.dark')
  })

  it('renders tooltip rows with config labels and colors', () => {
    const wrapper = mount(ChartContainer, {
      props: { config },
      slots: {
        default: () =>
          h(ChartTooltipContent, {
            active: true,
            label: 'Jan',
            payload: [
              { dataKey: 'revenue', value: 120 },
              { dataKey: 'cost', value: 80 },
            ],
          }),
      },
    })

    const text = wrapper.text()
    expect(text).toContain('Revenue')
    expect(text).toContain('120')
    expect(text).toContain('Cost')
    expect(text).toContain('Jan')
  })

  it('hides the tooltip when inactive', () => {
    const wrapper = mount(ChartContainer, {
      props: { config },
      slots: {
        default: () => h(ChartTooltipContent, { active: false, payload: [{ value: 1 }] }),
      },
    })
    expect(wrapper.find('[data-slot="chart-tooltip-content"]').exists()).toBe(false)
  })

  it('renders legend entries from config', () => {
    const wrapper = mount(ChartContainer, {
      props: { config },
      slots: {
        default: () =>
          h(ChartLegendContent, { payload: [{ value: 'revenue' }, { value: 'cost' }] }),
      },
    })

    expect(wrapper.text()).toContain('Revenue')
    expect(wrapper.text()).toContain('Cost')
  })

  it('generates no style element without colors', () => {
    const wrapper = mount(ChartStyle, { props: { id: 'x', config: { a: { label: 'A' } } } })
    expect(wrapper.find('style').exists()).toBe(false)
  })
})

import { h } from 'vue'
