import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { useUITranslation } from '../../../i18n'

import { cn } from '../../../lib/utils'

const DIRECTION_STYLES = {
  up: { icon: ArrowUpRight, className: 'text-success' },
  down: { icon: ArrowDownRight, className: 'text-destructive' },
  flat: { icon: Minus, className: 'text-muted-foreground' },
} as const

export function Trend({
  value,
  label,
  suffix = '%',
  precision = 1,
  invert = false,
  className,
}: {
  /** Signed delta to format; its sign decides the arrow and direction. */
  value: number
  /** Context announced and shown after the value, e.g. "vs last month". */
  label?: string
  /** Text appended directly after the formatted number. */
  suffix?: string
  /** Maximum fraction digits passed to `Intl.NumberFormat`. */
  precision?: number
  /** Flips the success/destructive tone for metrics where lower is better. */
  invert?: boolean
  /** Extra classes for the inline wrapper. */
  className?: string
}) {
  const { locale } = useUITranslation()
  const direction = value > 0 ? 'up' : value < 0 ? 'down' : 'flat'
  const tone = direction === 'flat' || !invert ? direction : direction === 'up' ? 'down' : 'up'
  const Icon = DIRECTION_STYLES[direction].icon
  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: precision,
    signDisplay: 'exceptZero',
  }).format(value)
  const text = `${formatted}${suffix}`
  const accessibleLabel = [text, label].filter(Boolean).join(' ')

  return (
    <span
      role="img"
      aria-label={accessibleLabel}
      data-slot="trend"
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium',
        DIRECTION_STYLES[tone].className,
        className,
      )}
    >
      <Icon aria-hidden className="size-3.5" />
      <span aria-hidden>{text}</span>
      {label ? (
        <span aria-hidden className="font-normal text-muted-foreground">
          {label}
        </span>
      ) : null}
    </span>
  )
}
