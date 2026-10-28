import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useUITranslation } from '../../../i18n'

import { Skeleton } from '../../ui/skeleton'
import { cn } from '../../../lib/utils'

const TREND_STYLES = {
  up: { icon: ArrowUpRight, className: 'text-success' },
  down: { icon: ArrowDownRight, className: 'text-destructive' },
  flat: { icon: Minus, className: 'text-muted-foreground' },
} as const

export function Statistic({
  label,
  value,
  precision,
  prefix,
  suffix,
  trend,
  icon,
  loading = false,
  className,
}: {
  /** Name of the metric; also the first word of the trend's accessible label. */
  label: string
  /** Numbers go through Intl.NumberFormat; strings render verbatim. */
  value: number | string
  /** Fixed number of fraction digits passed to Intl.NumberFormat. */
  precision?: number
  /** Node shown before the value, for example a currency symbol. */
  prefix?: ReactNode
  /** Node shown after the value, for example a unit. */
  suffix?: ReactNode
  /** Percentage change; its sign selects the up, down or flat icon and tone. */
  trend?: { value: number; label?: string }
  /** Lucide icon shown in the tile at the top right. */
  icon?: LucideIcon
  /** Swaps the value for two skeleton blocks and marks the card aria-busy. */
  loading?: boolean
  /** Extra classes merged onto the card. */
  className?: string
}) {
  const { locale } = useUITranslation()
  const Icon = icon

  const formatted =
    typeof value === 'number'
      ? new Intl.NumberFormat(locale, {
          minimumFractionDigits: precision,
          maximumFractionDigits: precision,
        }).format(value)
      : value

  const direction = trend ? (trend.value > 0 ? 'up' : trend.value < 0 ? 'down' : 'flat') : 'flat'
  const TrendIcon = TREND_STYLES[direction].icon
  const trendValue = trend
    ? new Intl.NumberFormat(locale, {
        maximumFractionDigits: 1,
        signDisplay: 'exceptZero',
      }).format(trend.value)
    : undefined
  const trendText = trendValue ? `${trendValue}%` : undefined
  const trendLabel = trend ? [label, trendText, trend.label].filter(Boolean).join(' ') : undefined

  return (
    <div
      data-slot="statistic"
      aria-busy={loading || undefined}
      className={cn('rounded-xl border bg-card p-5 text-card-foreground shadow-xs', className)}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon ? (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" />
          </span>
        ) : null}
      </div>

      {loading ? (
        <div className="mt-2 space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      ) : (
        <>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
            {prefix ? (
              <span className="text-lg font-medium text-muted-foreground">{prefix}</span>
            ) : null}
            <span className="text-2xl font-semibold tracking-tight tabular-nums">{formatted}</span>
            {suffix ? <span className="text-sm text-muted-foreground">{suffix}</span> : null}
          </div>
          {trend && trendText ? (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
              <span
                aria-label={trendLabel}
                className={cn(
                  'inline-flex items-center gap-0.5 font-medium',
                  TREND_STYLES[direction].className,
                )}
              >
                <TrendIcon aria-hidden className="size-3.5" />
                {trendText}
              </span>
              {trend.label ? <span className="text-muted-foreground">{trend.label}</span> : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
