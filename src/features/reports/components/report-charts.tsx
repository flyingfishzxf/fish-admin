import { useTranslation } from 'react-i18next'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  formatCompactNumber,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
} from '@/lib/format'
import type { ReportChannel, ReportPoint } from '@/types'

export type ReportMetric = 'revenue' | 'orders'

const CHANNEL_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

export function ReportTrendChart({
  data,
  metric,
  color,
  target,
}: {
  data: ReportPoint[]
  metric: ReportMetric
  color: string
  target: number
}) {
  const { t, i18n } = useTranslation('reports')
  const config = {
    value: { label: t(`trend.metrics.${metric}`), color },
  } satisfies ChartConfig

  const chartData = data.map((point) => ({
    date: point.date,
    value:
      metric === 'revenue' ? Math.round(point.revenue / point.days) : point.orders / point.days,
  }))

  return (
    <ChartContainer config={config} className="aspect-auto h-[300px] w-full">
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="report-trend-fill" x1="0" y1="0" x2="0" y2="1">
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
          tickFormatter={(value: string) =>
            formatDate(value, i18n.language, { month: 'short', day: 'numeric' })
          }
        />
        <YAxis
          width={52}
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
              formatter={(value) => (
                <span className="font-mono font-medium text-foreground tabular-nums">
                  {metric === 'revenue'
                    ? formatCurrency(Number(value), i18n.language)
                    : formatNumber(Number(value), i18n.language, {
                        maximumFractionDigits: 1,
                      })}
                </span>
              )}
            />
          }
        />
        {metric === 'revenue' ? (
          <ReferenceLine
            y={target}
            stroke={color}
            strokeDasharray="6 4"
            strokeOpacity={0.7}
            ifOverflow="extendDomain"
            label={{
              value: t('trend.targetLine'),
              position: 'insideTopRight',
              fill: 'var(--muted-foreground)',
              fontSize: 11,
            }}
          />
        ) : null}
        <Area
          dataKey="value"
          type="monotone"
          fill="url(#report-trend-fill)"
          stroke="var(--color-value)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ChartContainer>
  )
}

export function ReportChannelsChart({ data }: { data: ReportChannel[] }) {
  const { t, i18n } = useTranslation('reports')
  const config = {
    direct: { label: t('channels.names.direct'), color: CHANNEL_COLORS[0] },
    organic: { label: t('channels.names.organic'), color: CHANNEL_COLORS[1] },
    referral: { label: t('channels.names.referral'), color: CHANNEL_COLORS[2] },
    social: { label: t('channels.names.social'), color: CHANNEL_COLORS[3] },
    email: { label: t('channels.names.email'), color: CHANNEL_COLORS[4] },
  } satisfies ChartConfig

  const total = data.reduce((sum, channel) => sum + channel.value, 0)

  return (
    <div className="grid gap-4 sm:grid-cols-[minmax(0,220px)_1fr] sm:items-center">
      <ChartContainer config={config} className="mx-auto aspect-square h-[220px] w-full">
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                nameKey="name"
                hideLabel
                formatter={(value) => (
                  <span className="font-mono font-medium text-foreground tabular-nums">
                    {formatCurrency(Number(value), i18n.language)}
                  </span>
                )}
              />
            }
          />
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

      <ul className="space-y-3">
        {data.map((channel) => {
          const item = config[channel.name as keyof typeof config]
          const share = total > 0 ? (channel.value / total) * 100 : 0

          return (
            <li key={channel.name} className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item?.color }}
                />
                <span className="flex-1 truncate text-muted-foreground">
                  {item?.label ?? channel.name}
                </span>
                <span className="font-medium tabular-nums">
                  {formatCurrency(channel.value, i18n.language)}
                </span>
                <span className="w-14 text-right text-xs text-muted-foreground tabular-nums">
                  {formatPercent(share, i18n.language)}
                </span>
              </div>
              <div className="ml-4.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${share}%`, backgroundColor: item?.color }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
