import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { WorkflowStatus, WorkflowType } from '@/types'

const STATUS_CLASSES: Record<WorkflowStatus, string> = {
  pending: 'border-chart-4/30 bg-chart-4/14 text-chart-4-foreground',
  approved: 'border-chart-3/30 bg-chart-3/12 text-chart-3-foreground',
  rejected: 'border-destructive/25 bg-destructive/10 text-destructive',
}

const TYPE_CLASSES: Record<WorkflowType, string> = {
  purchase: 'border-chart-1/30 bg-chart-1/12 text-chart-1-foreground',
  leave: 'border-chart-3/30 bg-chart-3/12 text-chart-3-foreground',
  seal: 'border-chart-4/30 bg-chart-4/14 text-chart-4-foreground',
  change: 'border-chart-5/30 bg-chart-5/12 text-chart-5-foreground',
}

export function WorkflowStatusBadge({
  status,
  label,
  className,
}: {
  status: WorkflowStatus
  label: string
  className?: string
}) {
  return (
    <Badge variant="outline" className={cn(STATUS_CLASSES[status], className)}>
      {label}
    </Badge>
  )
}

export function WorkflowTypeBadge({
  type,
  label,
  className,
}: {
  type: WorkflowType
  label: string
  className?: string
}) {
  return (
    <Badge variant="outline" className={cn(TYPE_CLASSES[type], className)}>
      {label}
    </Badge>
  )
}

export function WorkflowCodeMark({ code, className }: { code: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 px-2 text-center text-[11px] font-semibold tracking-wide text-accent-foreground',
        className,
      )}
    >
      {code.replace(/^WF-/, '')}
    </span>
  )
}
