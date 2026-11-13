import type {
  Integration,
  IntegrationDelivery,
  IntegrationMode,
  PaginatedResult,
} from '@fish-admin/contracts'

import { apiRequest } from '../../lib/api-client'

export interface IntegrationListParams {
  page: number
  pageSize: number
  provider?: string
  enabled?: boolean
}

export interface IntegrationHeaderInput {
  id?: string
  key: string
  value: string
}

export interface IntegrationInput {
  name: string
  provider: string
  endpoint: string
  event: string
  mode: IntegrationMode
  enabled: boolean
  headers: IntegrationHeaderInput[]
}

export interface RecentDelivery extends IntegrationDelivery {
  integrationName: string
}

// `enabled` travels as `1`/`0`: the handler compares strings, so a boolean
// would serialise as "true" and never match.
export function fetchIntegrations(params: IntegrationListParams, signal?: AbortSignal) {
  const search = new URLSearchParams()
  search.set('page', String(params.page))
  search.set('pageSize', String(params.pageSize))
  if (params.provider) search.set('provider', params.provider)
  if (params.enabled !== undefined) search.set('enabled', params.enabled ? '1' : '0')

  return apiRequest<PaginatedResult<Integration>>(`/integrations?${search.toString()}`, { signal })
}

export function fetchRecentDeliveries(limit: number, signal?: AbortSignal) {
  return apiRequest<{ items: RecentDelivery[]; total: number }>(
    `/integrations/deliveries?limit=${limit}`,
    { signal },
  )
}

export function fetchIntegrationDeliveries(id: string, signal?: AbortSignal) {
  return apiRequest<{ integrationId: string; items: IntegrationDelivery[] }>(
    `/integrations/${encodeURIComponent(id)}/deliveries`,
    { signal },
  )
}

export function createIntegration(input: IntegrationInput) {
  return apiRequest<Integration>('/integrations', { method: 'POST', body: input })
}

export function updateIntegration(id: string, input: Partial<IntegrationInput>) {
  return apiRequest<Integration>(`/integrations/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: input,
  })
}

export function deleteIntegration(id: string) {
  return apiRequest<void>(`/integrations/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

// Replay records a brand-new delivery; the response is that delivery, not the
// original one, so callers must refetch the history to see it.
export function retryDelivery(integrationId: string, deliveryId: string) {
  return apiRequest<IntegrationDelivery>(
    `/integrations/${encodeURIComponent(integrationId)}/deliveries/${encodeURIComponent(deliveryId)}/retry`,
    { method: 'POST' },
  )
}
