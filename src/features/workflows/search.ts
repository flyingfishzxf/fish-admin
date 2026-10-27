import type { WorkflowStatus, WorkflowType } from '@/types'

import type { WorkflowView } from './api'

export type WorkflowRangePreset = 'today' | 'last7' | 'last30' | 'last90' | 'thisMonth'

export interface WorkflowSearch {
  page: number
  pageSize: number
  view: WorkflowView
  q?: string
  status?: WorkflowStatus
  type?: WorkflowType
  initiatorId?: string
  from?: string
  to?: string
}

export const WORKFLOW_TYPES: WorkflowType[] = ['purchase', 'leave', 'seal', 'change']
export const WORKFLOW_STATUSES: WorkflowStatus[] = ['pending', 'approved', 'rejected']

const VIEWS: WorkflowView[] = ['mine', 'pending', 'all']

export const DEFAULT_WORKFLOWS_SEARCH: WorkflowSearch = {
  page: 1,
  pageSize: 10,
  view: 'pending',
}

function formatDayValue(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isValidDay(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

export function workflowRangePreset(preset: WorkflowRangePreset, now = new Date()) {
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const from = new Date(to)

  if (preset === 'last7') from.setDate(to.getDate() - 6)
  if (preset === 'last30') from.setDate(to.getDate() - 29)
  if (preset === 'last90') from.setDate(to.getDate() - 89)
  if (preset === 'thisMonth') from.setDate(1)

  return { from: formatDayValue(from), to: formatDayValue(to) }
}

export function validateWorkflowsSearch(search: Record<string, unknown>): WorkflowSearch {
  const page = Number(search.page)
  const pageSize = Number(search.pageSize)
  const view = VIEWS.includes(search.view as WorkflowView)
    ? (search.view as WorkflowView)
    : DEFAULT_WORKFLOWS_SEARCH.view
  const status = WORKFLOW_STATUSES.includes(search.status as WorkflowStatus)
    ? (search.status as WorkflowStatus)
    : undefined
  const type = WORKFLOW_TYPES.includes(search.type as WorkflowType)
    ? (search.type as WorkflowType)
    : undefined

  let from = isValidDay(search.from) ? search.from : undefined
  let to = isValidDay(search.to) ? search.to : undefined
  if (from && to && from > to) [from, to] = [to, from]

  return {
    page: Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1,
    pageSize:
      Number.isFinite(pageSize) && pageSize >= 10 && pageSize <= 100
        ? Math.floor(pageSize)
        : DEFAULT_WORKFLOWS_SEARCH.pageSize,
    view,
    q: typeof search.q === 'string' && search.q.trim() ? search.q.trim() : undefined,
    status,
    type,
    initiatorId:
      typeof search.initiatorId === 'string' && search.initiatorId ? search.initiatorId : undefined,
    from,
    to,
  }
}
