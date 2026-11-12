import type { ReportGranularity } from '@fish-admin/contracts'

export const REPORT_RANGES = ['last7', 'last30', 'last90'] as const
export type ReportRange = (typeof REPORT_RANGES)[number]

export const REPORT_GRANULARITIES: readonly ReportGranularity[] = ['day', 'week', 'month']

export interface ReportSearch {
  range: ReportRange
  granularity: ReportGranularity
  page: number
}

export const DEFAULT_REPORT_SEARCH: ReportSearch = {
  range: 'last30',
  granularity: 'day',
  page: 1,
}

const RANGE_DAYS: Record<ReportRange, number> = {
  last7: 7,
  last30: 30,
  last90: 90,
}

function formatDay(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Both bounds are inclusive, so a 30-day range spans 29 days between them. */
export function toDateRange(range: ReportRange, today = new Date()) {
  const from = new Date(today)
  from.setDate(today.getDate() - (RANGE_DAYS[range] - 1))
  return { from: formatDay(from), to: formatDay(today) }
}
