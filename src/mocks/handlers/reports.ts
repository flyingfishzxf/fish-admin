import { http } from 'msw'

import { env } from '@/config/env'
import { PERMISSION_CODES } from '@/config/permissions'
import { formatDayValue, parseDay } from '@fish-admin/react/internal/date'
import type { ReportGranularity } from '@/types'

import { authorize } from '../auth'
import { readDb } from '../db/store'
import { HttpError, run } from '../http'
import { buildReport, MAX_REPORT_DAYS } from '../reports'

const API = env.apiBaseUrl
const GRANULARITIES: ReportGranularity[] = ['day', 'week', 'month']
const DEFAULT_RANGE_DAYS = 30

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export const reportHandlers = [
  http.get(`${API}/reports`, ({ request }) =>
    run(() => {
      const db = readDb()
      authorize(db, request, PERMISSION_CODES.reportRead)

      const params = new URL(request.url).searchParams
      const granularityParam = params.get('granularity')
      if (granularityParam && !GRANULARITIES.includes(granularityParam as ReportGranularity)) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Unknown report granularity.')
      }

      const today = formatDayValue(new Date())
      const toValue = params.get('to') ?? today
      const to = parseDay(toValue)
      if (!to) {
        throw new HttpError(400, 'INVALID_DATE', 'Dates must use the yyyy-MM-dd format.')
      }

      const fromValue = params.get('from') ?? formatDayValue(addDays(to, -(DEFAULT_RANGE_DAYS - 1)))
      const from = parseDay(fromValue)
      if (!from) {
        throw new HttpError(400, 'INVALID_DATE', 'Dates must use the yyyy-MM-dd format.')
      }
      if (from > to) {
        throw new HttpError(400, 'INVALID_RANGE', 'The start date must be before the end date.')
      }

      const span = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1
      if (span > MAX_REPORT_DAYS) {
        throw new HttpError(400, 'INVALID_RANGE', `Reports span at most ${MAX_REPORT_DAYS} days.`)
      }

      const granularity = (granularityParam as ReportGranularity | null) ?? 'day'

      return {
        ...buildReport({ from: fromValue, to: toValue, granularity }),
        generatedAt: new Date().toISOString(),
      }
    }),
  ),
]
