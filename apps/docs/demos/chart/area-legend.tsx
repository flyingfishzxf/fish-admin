import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@fish-admin/react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'

const config = {
  revenue: { label: 'Revenue', color: 'var(--chart-1)' },
  costs: { label: 'Operating costs', color: 'var(--chart-4)' },
} satisfies ChartConfig

const data = [
  { month: 'Jan', revenue: 38200, costs: 24100 },
  { month: 'Feb', revenue: 40500, costs: 25200 },
  { month: 'Mar', revenue: 39100, costs: 24800 },
  { month: 'Apr', revenue: 43800, costs: 26400 },
  { month: 'May', revenue: 46200, costs: 27100 },
  { month: 'Jun', revenue: 48290, costs: 27600 },
]

export default function ChartAreaLegend() {
  return (
    <div className="fish-demo-stack">
      <div>
        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>
          Revenue against operating costs
        </p>
        <p className="fish-demo-muted" style={{ margin: '0.15rem 0 0' }}>
          Two series share one axis; the legend maps each colour to its key.
        </p>
      </div>
      <ChartContainer config={config} style={{ width: '100%', height: 240 }}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="demo-chart-revenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="4%" stopColor="var(--color-revenue)" stopOpacity={0.35} />
              <stop offset="96%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="demo-chart-costs" x1="0" y1="0" x2="0" y2="1">
              <stop offset="4%" stopColor="var(--color-costs)" stopOpacity={0.3} />
              <stop offset="96%" stopColor="var(--color-costs)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="4 4" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
          <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
          <Area
            dataKey="revenue"
            type="monotone"
            fill="url(#demo-chart-revenue)"
            stroke="var(--color-revenue)"
            strokeWidth={2}
            dot={false}
          />
          <Area
            dataKey="costs"
            type="monotone"
            fill="url(#demo-chart-costs)"
            stroke="var(--color-costs)"
            strokeWidth={2}
            dot={false}
          />
          <ChartLegend content={<ChartLegendContent />} />
        </AreaChart>
      </ChartContainer>
    </div>
  )
}
