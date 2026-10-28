import {
  AlertTriangle,
  CheckCircle2,
  FileQuestion,
  Info,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '../../../lib/utils'

export type ResultStatus = 'success' | 'info' | 'warning' | 'error' | 'not-found'

const RESULT_STYLES: Record<ResultStatus, { icon: LucideIcon; tile: string }> = {
  success: { icon: CheckCircle2, tile: 'bg-chart-3/14 text-chart-3-foreground' },
  info: { icon: Info, tile: 'bg-chart-1/12 text-chart-1-foreground' },
  warning: { icon: AlertTriangle, tile: 'bg-chart-4/16 text-chart-4-foreground' },
  error: { icon: XCircle, tile: 'bg-destructive/10 text-destructive' },
  'not-found': { icon: FileQuestion, tile: 'bg-muted text-muted-foreground' },
}

export function Result({
  status,
  title,
  description,
  extra,
  className,
}: {
  /** Outcome to show; also picks the icon and the icon tile colours. */
  status: ResultStatus
  /** Main message, rendered as an h2. */
  title: ReactNode
  /** Supporting sentence, centred and capped at max-w-md. */
  description?: ReactNode
  /** Action row under the copy, for buttons or links. */
  extra?: ReactNode
  /** Extra classes merged onto the wrapper, for example to tighten the default py-16. */
  className?: string
}) {
  const { icon: Icon, tile } = RESULT_STYLES[status]

  return (
    <div
      role={status === 'error' ? 'alert' : 'status'}
      className={cn('flex flex-col items-center gap-4 px-6 py-16 text-center', className)}
    >
      <span className={cn('flex size-14 items-center justify-center rounded-2xl', tile)}>
        <Icon className="size-7" />
      </span>
      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description ? (
          <div className="mx-auto max-w-md text-sm text-muted-foreground">{description}</div>
        ) : null}
      </div>
      {extra ? (
        <div className="flex flex-wrap items-center justify-center gap-2">{extra}</div>
      ) : null}
    </div>
  )
}
