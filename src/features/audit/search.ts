import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '@/config/audit'
import type { AuditAction, AuditEntityType } from '@/types'

export type AuditRangePreset = 'today' | 'last7' | 'last30' | 'last90' | 'thisMonth'

export interface AuditSearch {
  page: number
  pageSize: number
  q?: string
  action?: AuditAction
  entityType?: AuditEntityType
  from?: string
  to?: string
}

export const DEFAULT_AUDIT_SEARCH: AuditSearch = {
  page: 1,
  pageSize: 20,
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

export function auditRangePreset(preset: AuditRangePreset, now = new Date()) {
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const from = new Date(to)

  if (preset === 'last7') from.setDate(to.getDate() - 6)
  if (preset === 'last30') from.setDate(to.getDate() - 29)
  if (preset === 'last90') from.setDate(to.getDate() - 89)
  if (preset === 'thisMonth') from.setDate(1)

  return { from: formatDayValue(from), to: formatDayValue(to) }
}

export function validateAuditSearch(search: Record<string, unknown>): AuditSearch {
  const page = Number(search.page)
  const pageSize = Number(search.pageSize)
  const q = typeof search.q === 'string' && search.q.trim() ? search.q.trim() : undefined
  const action = AUDIT_ACTIONS.includes(search.action as AuditAction)
    ? (search.action as AuditAction)
    : undefined
  const entityType = AUDIT_ENTITY_TYPES.includes(search.entityType as AuditEntityType)
    ? (search.entityType as AuditEntityType)
    : undefined

  let from = isValidDay(search.from) ? search.from : undefined
  let to = isValidDay(search.to) ? search.to : undefined
  if (from && to && from > to) [from, to] = [to, from]

  return {
    page: Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1,
    pageSize:
      Number.isFinite(pageSize) && pageSize >= 10 && pageSize <= 100
        ? Math.floor(pageSize)
        : DEFAULT_AUDIT_SEARCH.pageSize,
    q,
    action,
    entityType,
    from,
    to,
  }
}
