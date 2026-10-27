import { useTranslation } from 'react-i18next'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts'

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@fish-admin/react'
import { formatCompactNumber, formatDate } from '@/lib/format'
import type { ChannelPoint, RevenuePoint, TrafficPoint } from '@/types'

function dateTick(value: string, language: string) {
  return formatDate(value, language, { month: 'short', day: 'numeric' })
}

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const { t, i18n } = useTranslation('dashboard')
  const config = {
    value: { label: t('series.revenue'), color: 'var(--chart-1)' },
  } satisfies ChartConfig

  return (
    <ChartContainer config={config} className="aspect-auto h-[280px] w-full">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="4%" stopColor="var(--color-value)" stopOpacity={0.35} />
            <stop offset="96%" stopColor="var(--color-value)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="4 4" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          minTickGap={28}
          tickFormatter={(value: string) => dateTick(value, i18n.language)}
        />
        <YAxis
          width={48}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: number) => formatCompactNumber(value, i18n.language)}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              indicator="line"
              labelFormatter={(value) =>
                formatDate(String(value), i18n.language, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              }
            />
          }
        />
        <Area
          dataKey="value"
          type="monotone"
          fill="url(#revenue-fill)"
          stroke="var(--color-value)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ChartContainer>
  )
}

export function TrafficChart({ data }: { data: TrafficPoint[] }) {
  const { t, i18n } = useTranslation('dashboard')
  const config = {
    visits: { label: t('series.visits'), color: 'var(--chart-2)' },
    signups: { label: t('series.signups'), color: 'var(--chart-3)' },
  } satisfies ChartConfig

  return (
    <ChartContainer config={config} className="aspect-auto h-[280px] w-full">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="4 4" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          minTickGap={28}
          tickFormatter={(value: string) => dateTick(value, i18n.language)}
        />
        <YAxis
          width={48}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: number) => formatCompactNumber(value, i18n.language)}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(value) =>
                formatDate(String(value), i18n.language, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              }
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="visits" fill="var(--color-visits)" radius={3} maxBarSize={18} />
        <Bar dataKey="signups" fill="var(--color-signups)" radius={3} maxBarSize={18} />
      </BarChart>
    </ChartContainer>
  )
}

export function ChannelsChart({ data }: { data: ChannelPoint[] }) {
  const { t, i18n } = useTranslation('dashboard')
  const config = {
    direct: { label: t('channels.direct'), color: 'var(--chart-1)' },
    organic: { label: t('channels.organic'), color: 'var(--chart-2)' },
    referral: { label: t('channels.referral'), color: 'var(--chart-3)' },
    social: { label: t('channels.social'), color: 'var(--chart-4)' },
    email: { label: t('channels.email'), color: 'var(--chart-5)' },
  } satisfies ChartConfig

  return (
    <div className="grid gap-2 sm:grid-cols-[minmax(0,200px)_1fr] sm:items-center">
      <ChartContainer config={config} className="mx-auto aspect-square h-[200px] w-full">
        <PieChart>
          <ChartTooltip cursor={false} content={<ChartTooltipContent nameKey="name" hideLabel />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={3}
            strokeWidth={0}
          >
            {data.map((channel) => (
              <Cell key={channel.name} fill={`var(--color-${channel.name})`} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>

      <ul className="space-y-2.5">
        {data.map((channel) => {
          const item = config[channel.name as keyof typeof config]
          return (
            <li key={channel.name} className="flex items-center gap-2.5 text-sm">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item?.color }}
              />
              <span className="flex-1 truncate text-muted-foreground">
                {item?.label ?? channel.name}
              </span>
              <span className="font-medium tabular-nums">
                {new Intl.NumberFormat(i18n.language, {
                  maximumFractionDigits: 1,
                }).format(channel.value)}
                %
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
