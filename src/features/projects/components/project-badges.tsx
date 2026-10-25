import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ProjectPriority, ProjectStatus } from '@/types'

const STATUS_CLASSES: Record<ProjectStatus, string> = {
  planning: 'border-border bg-muted text-muted-foreground',
  active: 'border-chart-3/30 bg-chart-3/12 text-chart-3-foreground',
  review: 'border-chart-4/30 bg-chart-4/14 text-chart-4-foreground',
  done: 'border-chart-1/30 bg-chart-1/12 text-chart-1-foreground',
}

const PRIORITY_CLASSES: Record<ProjectPriority, string> = {
  low: 'border-border text-muted-foreground',
  medium: 'border-chart-1/30 bg-chart-1/12 text-chart-1-foreground',
  high: 'border-destructive/25 bg-destructive/10 text-destructive',
}

export function ProjectStatusBadge({
  status,
  label,
  className,
}: {
  status: ProjectStatus
  label: string
  className?: string
}) {
  return (
    <Badge variant="outline" className={cn(STATUS_CLASSES[status], className)}>
      {label}
    </Badge>
  )
}

export function ProjectPriorityBadge({
  priority,
  label,
  className,
}: {
  priority: ProjectPriority
  label: string
  className?: string
}) {
  return (
    <Badge variant="outline" className={cn(PRIORITY_CLASSES[priority], className)}>
      {label}
    </Badge>
  )
}

export function ProjectKeyMark({
  projectKey,
  className,
}: {
  projectKey: string
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-semibold tracking-wide text-accent-foreground',
        className,
      )}
    >
      {projectKey}
    </span>
  )
}
