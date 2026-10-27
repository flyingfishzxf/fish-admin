import { formatDayValue, parseDay } from '@fish-admin/react/internal/date'
import type { ReportGranularity } from '@/types'

export interface ReportsSearch {
  from?: string
  to?: string
  granularity: ReportGranularity
}

export const DEFAULT_REPORTS_SEARCH: ReportsSearch = { granularity: 'day' }

const GRANULARITIES: ReportGranularity[] = ['day', 'week', 'month']
const DEFAULT_RANGE_DAYS = 30
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function pickDay(value: unknown) {
  return typeof value === 'string' && DAY_PATTERN.test(value) ? value : undefined
}

export function validateReportsSearch(search: Record<string, unknown>): ReportsSearch {
  const granularity = GRANULARITIES.includes(search.granularity as ReportGranularity)
    ? (search.granularity as ReportGranularity)
    : 'day'
  const from = pickDay(search.from)
  const to = pickDay(search.to)

  if (from && to && from <= to) return { from, to, granularity }
  return { granularity }
}

export interface ResolvedReportRange {
  from: string
  to: string
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function resolveReportRange(
  search: ReportsSearch,
  today: Date = new Date(),
): ResolvedReportRange {
  if (search.from && search.to) {
    return { from: search.from, to: search.to }
  }

  const to = formatDayValue(today)
  const from = formatDayValue(addDays(parseDay(to) ?? today, -(DEFAULT_RANGE_DAYS - 1)))
  return { from, to }
}
