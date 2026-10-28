import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '../../../lib/utils'

export type TimelineTone = 'default' | 'info' | 'success' | 'warning' | 'destructive'

export interface TimelineItem {
  id: string
  title: ReactNode
  description?: ReactNode
  timestamp?: ReactNode
  icon?: LucideIcon
  tone?: TimelineTone
}

const TONE_CLASSES: Record<TimelineTone, string> = {
  default: 'bg-muted text-muted-foreground',
  info: 'bg-chart-1/12 text-chart-1-foreground',
  success: 'bg-chart-3/14 text-chart-3-foreground',
  warning: 'bg-chart-4/16 text-chart-4-foreground',
  destructive: 'bg-destructive/10 text-destructive',
}

export function Timeline({
  items,
  emptyLabel,
  className,
}: {
  /** Events to render, top to bottom; the connecting line is drawn between all but the last. */
  items: TimelineItem[]
  /** Text shown in place of the list when `items` is empty; nothing renders when omitted. */
  emptyLabel?: string
  /** Extra classes for the ordered list wrapper. */
  className?: string
}) {
  if (items.length === 0) {
    return emptyLabel ? <p className="py-6 text-sm text-muted-foreground">{emptyLabel}</p> : null
  }

  return (
    <ol className={cn('space-y-0', className)}>
      {items.map((item, index) => {
        const Icon = item.icon
        const tone = item.tone ?? 'default'

        return (
          <li key={item.id} className="relative flex gap-3 pb-6 last:pb-0">
            {index < items.length - 1 ? (
              <span aria-hidden className="absolute top-8 bottom-0 left-4 w-px bg-border" />
            ) : null}
            <span
              className={cn(
                'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full',
                TONE_CLASSES[tone],
              )}
            >
              {Icon ? (
                <Icon className="size-4" />
              ) : (
                <span className="size-2 rounded-full bg-current" />
              )}
            </span>
            <div className="min-w-0 flex-1 space-y-0.5 pt-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-medium">{item.title}</p>
                {item.timestamp ? (
                  <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                ) : null}
              </div>
              {item.description ? (
                <div className="text-sm break-words text-muted-foreground">{item.description}</div>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
