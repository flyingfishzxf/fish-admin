import { http } from 'msw'

import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '@/config/audit'
import { env } from '@/config/env'
import { PERMISSION_CODES } from '@/config/permissions'
import type { AuditAction, AuditEntityType, AuditEvent, PaginatedResult } from '@/types'

import { authorize } from '../auth'
import { readDb } from '../db/store'
import { HttpError, run } from '../http'

const API = env.apiBaseUrl

function parseDayBoundary(value: string, endOfDay: boolean) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(
    year,
    month - 1,
    day,
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0,
  )
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }
  return date.getTime()
}

function matchesSearch(event: AuditEvent, search: string) {
  if (!search) return true
  const haystack = [event.actorName, event.entityLabel, ...Object.values(event.metadata)]
    .join(' ')
    .toLowerCase()
  return haystack.includes(search)
}

export const auditHandlers = [
  http.get(`${API}/audit-events`, ({ request }) =>
    run((): PaginatedResult<AuditEvent> => {
      const db = readDb()
      authorize(db, request, PERMISSION_CODES.auditRead)

      const url = new URL(request.url)
      const search = url.searchParams.get('q')?.trim().toLowerCase() ?? ''
      const action = url.searchParams.get('action')
      const entityType = url.searchParams.get('entityType')
      const entityId = url.searchParams.get('entityId')
      const fromParam = url.searchParams.get('from')
      const toParam = url.searchParams.get('to')

      if (action && !AUDIT_ACTIONS.includes(action as AuditAction)) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Unknown audit action.')
      }
      if (entityType && !AUDIT_ENTITY_TYPES.includes(entityType as AuditEntityType)) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Unknown audit entity type.')
      }

      const from = fromParam ? parseDayBoundary(fromParam, false) : null
      const to = toParam ? parseDayBoundary(toParam, true) : null
      if ((fromParam && from === null) || (toParam && to === null)) {
        throw new HttpError(400, 'INVALID_DATE_RANGE', 'Dates must use the yyyy-MM-dd format.')
      }
      if (from !== null && to !== null && from > to) {
        throw new HttpError(
          400,
          'INVALID_DATE_RANGE',
          'The start date must not be after the end date.',
        )
      }

      const filtered = db.auditEvents.filter((event) => {
        if (action && event.action !== action) return false
        if (entityType && event.entityType !== entityType) return false
        if (entityId && event.entityId !== entityId) return false
        if (from !== null && new Date(event.createdAt).getTime() < from) return false
        if (to !== null && new Date(event.createdAt).getTime() > to) return false
        return matchesSearch(event, search)
      })

      const sorted = [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      const pageSize = Math.min(Math.max(Number(url.searchParams.get('pageSize') ?? 20), 10), 100)
      const total = sorted.length
      const pageCount = Math.max(1, Math.ceil(total / pageSize))
      const page = Math.min(Math.max(Number(url.searchParams.get('page') ?? 1), 1), pageCount)
      const start = (page - 1) * pageSize

      return {
        items: sorted.slice(start, start + pageSize),
        total,
        page,
        pageSize,
        pageCount,
      }
    }),
  ),

  http.get(`${API}/audit-events/:id`, ({ request, params }) =>
    run(() => {
      const db = readDb()
      authorize(db, request, PERMISSION_CODES.auditRead)

      const event = db.auditEvents.find((item) => item.id === String(params.id))
      if (!event) throw new HttpError(404, 'AUDIT_EVENT_NOT_FOUND', 'Audit event not found.')

      const related = db.auditEvents
        .filter((item) => {
          if (item.id === event.id) return false
          if (event.entityId) {
            return item.entityType === event.entityType && item.entityId === event.entityId
          }
          return item.entityType === event.entityType && item.entityLabel === event.entityLabel
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5)

      return { event, related }
    }),
  ),
]
