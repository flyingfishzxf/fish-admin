import { render, screen, waitFor, within } from '@testing-library/react'
import type { TooltipPayloadEntry } from 'recharts'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from './chart'

const config = {
  revenue: { label: 'Revenue', color: 'var(--chart-1)' },
} satisfies ChartConfig

const data = [
  { month: 'May', revenue: 32400 },
  { month: 'Jun', revenue: 36100 },
  { month: 'Jul', revenue: 34800 },
]

/**
 * jsdom has no layout engine, so ResponsiveContainer measures the .recharts-responsive-container
 * wrapper as 0 x 0 and renders nothing. Feed it the geometry a browser would compute instead.
 */
const originalRect = HTMLElement.prototype.getBoundingClientRect

beforeEach(() => {
  HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
    if (this.classList?.contains('recharts-responsive-container')) {
      return {
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: 640,
        bottom: 240,
        width: 640,
        height: 240,
        toJSON: () => ({}),
      } as DOMRect
    }
    return originalRect.call(this)
  }
})

afterEach(() => {
  HTMLElement.prototype.getBoundingClientRect = originalRect
})

describe('ChartContainer', () => {
  it('renders the series, the legend and the colour variables for the given data', async () => {
    const { container } = render(
      <ChartContainer config={config} id="revenue" style={{ width: 640, height: 240 }}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="revenue" fill="var(--color-revenue)" isAnimationActive={false} />
        </BarChart>
      </ChartContainer>,
    )

    await waitFor(() => {
      expect(container.querySelectorAll('.recharts-bar-rectangle')).toHaveLength(data.length)
    })

    expect(container.querySelector('svg.recharts-surface')).toBeInTheDocument()
    expect(container.querySelector('[data-chart="chart-revenue"]')).toBeInTheDocument()
    expect(screen.getByText('Revenue')).toBeVisible()
    expect(container.querySelector('style')?.textContent).toContain(
      '--color-revenue: var(--chart-1);',
    )
  })

  it('renders the tooltip content for a payload configured through the chart config', () => {
    const payload: TooltipPayloadEntry[] = [
      {
        dataKey: 'revenue',
        name: 'revenue',
        value: 1234,
        color: 'var(--chart-1)',
        payload: { month: 'May', revenue: 1234 },
        graphicalItemId: 'revenue',
      },
    ]

    const { container } = render(
      <ChartContainer config={config} style={{ width: 640, height: 240 }}>
        <ChartTooltipContent active label="May" payload={payload} nameKey="revenue" />
      </ChartContainer>,
    )

    // Recharts appends a hidden text-measurement span to the body; scope the query to the chart.
    expect(within(container).getByText('May')).toBeVisible()
    expect(within(container).getByText('Revenue')).toBeVisible()
    expect(within(container).getByText('1,234')).toBeVisible()
  })
})
