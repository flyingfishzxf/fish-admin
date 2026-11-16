import type { WorkflowStatus, WorkflowType } from '@fish-admin/contracts'

/** Verbatim from the React badges so both templates colour a state the same. */
export const STATUS_CLASSES: Record<WorkflowStatus, string> = {
  pending: 'border-chart-4/30 bg-chart-4/14 text-chart-4-foreground',
  approved: 'border-chart-3/30 bg-chart-3/12 text-chart-3-foreground',
  rejected: 'border-destructive/25 bg-destructive/10 text-destructive',
}

export const TYPE_CLASSES: Record<WorkflowType, string> = {
  purchase: 'border-chart-1/30 bg-chart-1/12 text-chart-1-foreground',
  leave: 'border-chart-3/30 bg-chart-3/12 text-chart-3-foreground',
  seal: 'border-chart-4/30 bg-chart-4/14 text-chart-4-foreground',
  change: 'border-chart-5/30 bg-chart-5/12 text-chart-5-foreground',
}
