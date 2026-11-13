import { keepPreviousData, queryOptions } from '@tanstack/vue-query'

import {
  fetchIntegrationDeliveries,
  fetchIntegrations,
  fetchRecentDeliveries,
  type IntegrationListParams,
} from './api'

export const integrationKeys = {
  all: ['integrations'] as const,
  list: (params: IntegrationListParams) => [...integrationKeys.all, 'list', params] as const,
  recent: (limit: number) => [...integrationKeys.all, 'deliveries', 'recent', limit] as const,
  deliveries: (id: string | null) => [...integrationKeys.all, 'deliveries', id] as const,
}

export function integrationListQueryOptions(params: IntegrationListParams) {
  return queryOptions({
    queryKey: integrationKeys.list(params),
    queryFn: ({ signal }) => fetchIntegrations(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function recentDeliveriesQueryOptions(limit: number) {
  return queryOptions({
    queryKey: integrationKeys.recent(limit),
    queryFn: ({ signal }) => fetchRecentDeliveries(limit, signal),
    staleTime: 30_000,
  })
}

export function integrationDeliveriesQueryOptions(id: string | null) {
  return queryOptions({
    queryKey: integrationKeys.deliveries(id),
    queryFn: ({ signal }) => fetchIntegrationDeliveries(id as string, signal),
    enabled: Boolean(id),
  })
}
