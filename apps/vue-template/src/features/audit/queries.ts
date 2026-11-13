import { keepPreviousData, queryOptions } from '@tanstack/vue-query'

import { fetchAuditEvent, fetchAuditEvents, type AuditListParams } from './api'

export const auditKeys = {
  all: ['audit-events'] as const,
  list: (params: AuditListParams) => [...auditKeys.all, 'list', params] as const,
  detail: (id: string | null) => [...auditKeys.all, 'detail', id] as const,
}

export function auditListQueryOptions(params: AuditListParams) {
  return queryOptions({
    queryKey: auditKeys.list(params),
    queryFn: ({ signal }) => fetchAuditEvents(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function auditEventQueryOptions(id: string | null) {
  return queryOptions({
    queryKey: auditKeys.detail(id),
    queryFn: ({ signal }) => fetchAuditEvent(id as string, signal),
    enabled: Boolean(id),
  })
}
