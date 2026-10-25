import { apiRequest } from '@/lib/api-client'
import type { Integration, IntegrationDelivery, IntegrationMode, PaginatedResult } from '@/types'

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

export function fetchIntegrations(params: IntegrationListParams) {
  const search = new URLSearchParams()
  search.set('page', String(params.page))
  search.set('pageSize', String(params.pageSize))
  if (params.provider) search.set('provider', params.provider)
  if (params.enabled !== undefined) search.set('enabled', params.enabled ? '1' : '0')

  return apiRequest<PaginatedResult<Integration>>(`/integrations?${search.toString()}`)
}

export function fetchRecentDeliveries(limit: number) {
  return apiRequest<{ items: RecentDelivery[]; total: number }>(
    `/integrations/deliveries?limit=${limit}`,
  )
}

export function fetchIntegrationDeliveries(id: string) {
  return apiRequest<{ integrationId: string; items: IntegrationDelivery[] }>(
    `/integrations/${encodeURIComponent(id)}/deliveries`,
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

export function retryDelivery(integrationId: string, deliveryId: string) {
  return apiRequest<IntegrationDelivery>(
    `/integrations/${encodeURIComponent(integrationId)}/deliveries/${encodeURIComponent(deliveryId)}/retry`,
    { method: 'POST' },
  )
}
