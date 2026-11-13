import type {
  AuditAction,
  AuditEntityType,
  AuditEvent,
  PaginatedResult,
} from '@fish-admin/contracts'

import { apiRequest } from '../../lib/api-client'

export interface AuditListParams {
  page: number
  pageSize: number
  q?: string
  action?: AuditAction
  entityType?: AuditEntityType
  entityId?: string
  from?: string
  to?: string
}

// The endpoint pages, filters and sorts on the server, so every parameter the
// screen offers travels as a query string instead of being applied in memory.
export function fetchAuditEvents(params: AuditListParams, signal?: AbortSignal) {
  const search = new URLSearchParams()
  search.set('page', String(params.page))
  search.set('pageSize', String(params.pageSize))
  if (params.q) search.set('q', params.q)
  if (params.action) search.set('action', params.action)
  if (params.entityType) search.set('entityType', params.entityType)
  if (params.entityId) search.set('entityId', params.entityId)
  if (params.from) search.set('from', params.from)
  if (params.to) search.set('to', params.to)

  return apiRequest<PaginatedResult<AuditEvent>>(`/audit-events?${search.toString()}`, { signal })
}

export interface AuditEventDetail {
  event: AuditEvent
  related: AuditEvent[]
}

export function fetchAuditEvent(id: string, signal?: AbortSignal) {
  return apiRequest<AuditEventDetail>(`/audit-events/${encodeURIComponent(id)}`, { signal })
}
