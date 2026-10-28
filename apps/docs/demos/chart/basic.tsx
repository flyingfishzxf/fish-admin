import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@fish-admin/react'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'

const config = {
  revenue: { label: 'Revenue', color: 'var(--chart-1)' },
} satisfies ChartConfig

const data = [
  { month: 'May', revenue: 32400 },
  { month: 'Jun', revenue: 36100 },
  { month: 'Jul', revenue: 34800 },
  { month: 'Aug', revenue: 41200 },
  { month: 'Sep', revenue: 44700 },
  { month: 'Oct', revenue: 48290 },
]

export default function ChartBasic() {
  return (
    <div className="fish-demo-stack">
      <div>
        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>Revenue by month</p>
        <p className="fish-demo-muted" style={{ margin: '0.15rem 0 0' }}>
          Paid invoices in USD. Hover a bar for the exact amount.
        </p>
      </div>
      <ChartContainer config={config} style={{ width: '100%', height: 240 }}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="4 4" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
