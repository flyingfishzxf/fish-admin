import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'

import { fetchAuditEvent, fetchAuditEvents, type AuditListParams } from './api'

export const auditListQueryOptions = (params: AuditListParams) =>
  queryOptions({
    queryKey: ['audit-events', 'list', params],
    queryFn: ({ signal }) => fetchAuditEvents(params, signal),
    placeholderData: keepPreviousData,
  })

export function useAuditListQuery(params: AuditListParams) {
  return useQuery(auditListQueryOptions(params))
}

export const auditEventQueryOptions = (id: string | null) =>
  queryOptions({
    queryKey: ['audit-events', 'detail', id],
    queryFn: ({ signal }) => fetchAuditEvent(id as string, signal),
    enabled: Boolean(id),
  })

export function useAuditEventQuery(id: string | null) {
  return useQuery(auditEventQueryOptions(id))
}
