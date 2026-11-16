import type { ProjectPriority, ProjectStatus } from '@fish-admin/contracts'

/** Verbatim from the React badges so both templates colour a status the same. */
export const STATUS_CLASSES: Record<ProjectStatus, string> = {
  planning: 'border-border bg-muted text-muted-foreground',
  active: 'border-chart-3/30 bg-chart-3/12 text-chart-3-foreground',
  review: 'border-chart-4/30 bg-chart-4/14 text-chart-4-foreground',
  done: 'border-chart-1/30 bg-chart-1/12 text-chart-1-foreground',
}

export const PRIORITY_CLASSES: Record<ProjectPriority, string> = {
  low: 'border-border text-muted-foreground',
  medium: 'border-chart-1/30 bg-chart-1/12 text-chart-1-foreground',
  high: 'border-destructive/25 bg-destructive/10 text-destructive',
}
