import { apiRequest } from '@/lib/api-client'
import type { AuditEvent, PaginatedResult } from '@/types'

export interface AuditListParams {
  page: number
  pageSize: number
  q?: string
  action?: string
  entityType?: string
  entityId?: string
  from?: string
  to?: string
}

export function fetchAuditEvents(params: AuditListParams) {
  const search = new URLSearchParams()
  search.set('page', String(params.page))
  search.set('pageSize', String(params.pageSize))
  if (params.q) search.set('q', params.q)
  if (params.action) search.set('action', params.action)
  if (params.entityType) search.set('entityType', params.entityType)
  if (params.entityId) search.set('entityId', params.entityId)
  if (params.from) search.set('from', params.from)
  if (params.to) search.set('to', params.to)

  return apiRequest<PaginatedResult<AuditEvent>>(`/audit-events?${search.toString()}`)
}

export interface AuditEventDetail {
  event: AuditEvent
  related: AuditEvent[]
}

export function fetchAuditEvent(id: string) {
  return apiRequest<AuditEventDetail>(`/audit-events/${encodeURIComponent(id)}`)
}
