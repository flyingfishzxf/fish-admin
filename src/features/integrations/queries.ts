import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'

import {
  fetchIntegrationDeliveries,
  fetchIntegrations,
  fetchRecentDeliveries,
  type IntegrationListParams,
} from './api'

export const integrationListQueryOptions = (params: IntegrationListParams) =>
  queryOptions({
    queryKey: ['integrations', params],
    queryFn: ({ signal }) => fetchIntegrations(params, signal),
    placeholderData: keepPreviousData,
  })

export function useIntegrationListQuery(params: IntegrationListParams) {
  return useQuery(integrationListQueryOptions(params))
}

export const recentDeliveriesQueryOptions = (limit: number) =>
  queryOptions({
    queryKey: ['integrations', 'deliveries', 'recent', limit],
    queryFn: ({ signal }) => fetchRecentDeliveries(limit, signal),
    staleTime: 30_000,
  })

export function useRecentDeliveriesQuery(limit = 8) {
  return useQuery(recentDeliveriesQueryOptions(limit))
}

export const integrationDeliveriesQueryOptions = (id: string | null) =>
  queryOptions({
    queryKey: ['integrations', 'deliveries', id],
    queryFn: ({ signal }) => fetchIntegrationDeliveries(id as string, signal),
    enabled: Boolean(id),
  })

export function useIntegrationDeliveriesQuery(id: string | null) {
  return useQuery(integrationDeliveriesQueryOptions(id))
}
