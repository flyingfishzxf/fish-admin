import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

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
  value: number
  label?: string
  suffix?: string
  precision?: number
  invert?: boolean
  className?: string
}) {
  const { i18n } = useTranslation()
  const direction = value > 0 ? 'up' : value < 0 ? 'down' : 'flat'
  const tone = direction === 'flat' || !invert ? direction : direction === 'up' ? 'down' : 'up'
  const Icon = DIRECTION_STYLES[direction].icon
  const formatted = new Intl.NumberFormat(i18n.language, {
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
