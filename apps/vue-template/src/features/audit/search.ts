import type { AuditAction, AuditEntityType } from '@fish-admin/contracts'

/** The filters the page keeps in memory; the mock applies them server-side. */
export interface AuditSearch {
  page: number
  pageSize: number
  q?: string
  action?: AuditAction
  entityType?: AuditEntityType
  from?: string
  to?: string
}

// The mock clamps `pageSize` to 10–100, so 20 is both the default and the only
// size this screen offers; a size selector belongs with the shell in Slice 4.
export const AUDIT_PAGE_SIZE = 20

export const DEFAULT_AUDIT_SEARCH: AuditSearch = { page: 1, pageSize: AUDIT_PAGE_SIZE }

export type AuditRangePreset = 'today' | 'last7' | 'last30' | 'last90' | 'thisMonth'

export const AUDIT_PRESET_ORDER: AuditRangePreset[] = [
  'today',
  'last7',
  'last30',
  'last90',
  'thisMonth',
]

function formatDayValue(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Matches the mock's `parseDayBoundary`: `from` is local midnight and `to` is
// local end-of-day, so a preset covers both boundary days inclusively.
export function auditRangePreset(preset: AuditRangePreset, now = new Date()) {
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const from = new Date(to)

  if (preset === 'last7') from.setDate(to.getDate() - 6)
  if (preset === 'last30') from.setDate(to.getDate() - 29)
  if (preset === 'last90') from.setDate(to.getDate() - 89)
  if (preset === 'thisMonth') from.setDate(1)

  return { from: formatDayValue(from), to: formatDayValue(to) }
}

/** Drops the `actorId` noise so the summary column shows what changed. */
export function auditMetadataSummary(event: { metadata: Record<string, string> }, limit = 2) {
  return Object.entries(event.metadata)
    .filter(([key]) => key !== 'actorId')
    .slice(0, limit)
    .map(([key, value]) => `${key}: ${value}`)
    .join(' · ')
}
