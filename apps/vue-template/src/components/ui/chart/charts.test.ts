import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AreaChart from './AreaChart.vue'
import BarChart from './BarChart.vue'
import ChartShell from './ChartShell.vue'
import DonutChart from './DonutChart.vue'

const DAYS = [
  { label: 'Nov 1', value: 1200, tooltip: 'Nov 1, 2026' },
  { label: 'Nov 2', value: 1800, tooltip: 'Nov 2, 2026' },
  { label: 'Nov 3', value: 900, tooltip: 'Nov 3, 2026' },
  { label: 'Nov 4', value: 2400, tooltip: 'Nov 4, 2026' },
  { label: 'Nov 5', value: 1500, tooltip: 'Nov 5, 2026' },
]

const TRAFFIC = [
  { label: 'Nov 1', values: [320, 40], tooltip: 'Nov 1, 2026' },
  { label: 'Nov 2', values: [280, 32], tooltip: 'Nov 2, 2026' },
  { label: 'Nov 3', values: [410, 55], tooltip: 'Nov 3, 2026' },
]

const SERIES = [
  { name: 'direct', label: 'Direct', color: 'var(--chart-1)' },
  { name: 'organic', label: 'Organic', color: 'var(--chart-2)' },
]

describe('AreaChart', () => {
  it('draws a line and a filled area for the series', () => {
    const wrapper = mount(AreaChart, {
      props: {
        ariaLabel: 'Revenue',
        data: DAYS,
        color: 'var(--chart-1)',
        seriesLabel: 'Revenue',
        valueFormat: String,
      },
    })

    expect(wrapper.find('[data-chart-line]').exists()).toBe(true)
    expect(wrapper.find('[data-chart-area]').exists()).toBe(true)
    expect(wrapper.find('[data-chart-line]').attributes('stroke')).toBe('var(--chart-1)')
    expect(wrapper.find('[data-chart-reveal]').classes()).toContain('chart-reveal-x')
  })

  it('renders one y tick per axis value and keeps the axis at zero-based steps', () => {
    const wrapper = mount(AreaChart, {
      props: {
        ariaLabel: 'Revenue',
        data: DAYS,
        color: 'var(--chart-1)',
        seriesLabel: 'Revenue',
        valueFormat: String,
      },
    })

    const ticks = wrapper.findAll('[data-chart-y-axis] text')
    expect(ticks.length).toBeGreaterThanOrEqual(3)
    expect(ticks[0]!.text()).toBe('0')
  })

  it('skips the series paths when there is no data', () => {
    const wrapper = mount(AreaChart, {
      props: {
        ariaLabel: 'Revenue',
        data: [],
        color: 'var(--chart-1)',
        seriesLabel: 'Revenue',
        valueFormat: String,
      },
    })

    expect(wrapper.find('[data-chart-line]').exists()).toBe(false)
    expect(wrapper.find('[data-chart-area]').exists()).toBe(false)
  })

  it('draws the optional target reference line and caption', () => {
    const wrapper = mount(AreaChart, {
      props: {
        ariaLabel: 'Revenue',
        data: DAYS,
        color: 'var(--chart-1)',
        seriesLabel: 'Revenue',
        valueFormat: String,
        reference: { value: 2000, label: 'Target' },
      },
    })

    expect(wrapper.find('[data-chart-reference]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Target')
  })

  it('shows a tooltip for the nearest point on hover', async () => {
    const wrapper = mount(AreaChart, {
      props: {
        ariaLabel: 'Revenue',
        data: DAYS,
        color: 'var(--chart-1)',
        seriesLabel: 'Revenue',
        valueFormat: (value: number) => `${value} units`,
      },
    })

    expect(wrapper.find('[data-chart-tooltip]').exists()).toBe(false)
    await wrapper.find('[data-slot="chart"]').trigger('mousemove', { clientX: 300 })

    const tooltip = wrapper.find('[data-chart-tooltip]')
    expect(tooltip.exists()).toBe(true)
    expect(tooltip.text()).toContain('Revenue')
    expect(tooltip.text()).toContain('units')
    expect(wrapper.find('[data-chart-active-dot]').exists()).toBe(true)
  })

  it('drops the tooltip when the pointer leaves', async () => {
    const wrapper = mount(AreaChart, {
      props: {
        ariaLabel: 'Revenue',
        data: DAYS,
        color: 'var(--chart-1)',
        seriesLabel: 'Revenue',
        valueFormat: String,
      },
    })

    await wrapper.find('[data-slot="chart"]').trigger('mousemove', { clientX: 300 })
    expect(wrapper.find('[data-chart-tooltip]').exists()).toBe(true)

    await wrapper.find('[data-slot="chart"]').trigger('mouseleave')
    expect(wrapper.find('[data-chart-tooltip]').exists()).toBe(false)
  })
})

describe('BarChart', () => {
  const props = {
    ariaLabel: 'Traffic',
    data: TRAFFIC,
    series: [
      { label: 'Visits', color: 'var(--chart-2)' },
      { label: 'Signups', color: 'var(--chart-3)' },
    ],
    valueFormat: String,
  }

  it('renders one bar per category and series', () => {
    const wrapper = mount(BarChart, { props })
    expect(wrapper.findAll('[data-chart-bars] rect')).toHaveLength(TRAFFIC.length * 2)
    expect(wrapper.find('[data-chart-bars]').classes()).toContain('chart-reveal-y')
  })

  it('lists every series in the legend', () => {
    const wrapper = mount(BarChart, { props })
    const legend = wrapper.find('[data-chart-legend]')
    expect(legend.text()).toContain('Visits')
    expect(legend.text()).toContain('Signups')
  })

  it('renders nothing inside the plot without data', () => {
    const wrapper = mount(BarChart, { props: { ...props, data: [] } })
    expect(wrapper.findAll('[data-chart-bars] rect')).toHaveLength(0)
  })

  it('shows every series value on hover', async () => {
    const wrapper = mount(BarChart, { props })
    await wrapper.find('[data-slot="chart"]').trigger('mousemove', { clientX: 300 })

    const tooltip = wrapper.find('[data-chart-tooltip]')
    expect(tooltip.exists()).toBe(true)
    expect(tooltip.text()).toContain('Visits')
    expect(tooltip.text()).toContain('Signups')
  })
})

describe('DonutChart', () => {
  const props = {
    ariaLabel: 'Channels',
    data: [
      { name: 'direct', value: 60 },
      { name: 'organic', value: 40 },
    ],
    series: SERIES,
    valueFormat: (value: number) => `${value}%`,
  }

  it('draws one segment per channel in its series colour', () => {
    const wrapper = mount(DonutChart, { props })
    const segments = wrapper.findAll('[data-donut-segment]')
    expect(segments).toHaveLength(2)
    expect(segments[0]!.attributes('fill')).toBe('var(--chart-1)')
    expect(segments[1]!.attributes('fill')).toBe('var(--chart-2)')
    expect(segments[0]!.classes()).toContain('chart-reveal-pop')
    expect(segments[1]!.attributes('style')).toContain('animation-delay: 60ms')
  })

  it('shows a placeholder ring when every value is zero', () => {
    const wrapper = mount(DonutChart, {
      props: {
        ...props,
        data: [
          { name: 'direct', value: 0 },
          { name: 'organic', value: 0 },
        ],
      },
    })

    expect(wrapper.find('[data-chart-empty-ring]').exists()).toBe(true)
  })

  it('reveals the label and value of the hovered segment', async () => {
    const wrapper = mount(DonutChart, { props })
    expect(wrapper.find('[data-chart-tooltip]').exists()).toBe(false)

    await wrapper.find('[data-donut-segment="organic"]').trigger('mouseenter')

    const tooltip = wrapper.find('[data-chart-tooltip]')
    expect(tooltip.text()).toContain('Organic')
    expect(tooltip.text()).toContain('40%')
  })

  it('can report the share instead of the raw value', async () => {
    const wrapper = mount(DonutChart, { props: { ...props, tooltipMode: 'share' } })
    await wrapper.find('[data-donut-segment="direct"]').trigger('mouseenter')
    expect(wrapper.find('[data-chart-tooltip]').text()).toContain('60%')
  })
})

describe('ChartShell', () => {
  it('thins the x labels once they would collide', () => {
    const many = Array.from({ length: 40 }, (_, index) => `D${index}`)
    const wrapper = mount(ChartShell, {
      props: {
        ariaLabel: 'Dense axis',
        height: 200,
        yTicks: [0, 50, 100],
        xLabels: many,
      },
    })

    const labels = wrapper.findAll('[data-chart-x-axis] text')
    expect(labels.length).toBeGreaterThan(0)
    expect(labels.length).toBeLessThan(many.length)
  })

  it('keeps every label when they fit', () => {
    const wrapper = mount(ChartShell, {
      props: { ariaLabel: 'Short axis', height: 200, yTicks: [0, 10], xLabels: ['A', 'B', 'C'] },
    })

    expect(wrapper.findAll('[data-chart-x-axis] text')).toHaveLength(3)
  })
})
