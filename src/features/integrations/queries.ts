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
    queryFn: () => fetchIntegrations(params),
    placeholderData: keepPreviousData,
  })

export function useIntegrationListQuery(params: IntegrationListParams) {
  return useQuery(integrationListQueryOptions(params))
}

export const recentDeliveriesQueryOptions = (limit: number) =>
  queryOptions({
    queryKey: ['integrations', 'deliveries', 'recent', limit],
    queryFn: () => fetchRecentDeliveries(limit),
    staleTime: 30_000,
  })

export function useRecentDeliveriesQuery(limit = 8) {
  return useQuery(recentDeliveriesQueryOptions(limit))
}

export const integrationDeliveriesQueryOptions = (id: string | null) =>
  queryOptions({
    queryKey: ['integrations', 'deliveries', id],
    queryFn: () => fetchIntegrationDeliveries(id as string),
    enabled: Boolean(id),
  })

export function useIntegrationDeliveriesQuery(id: string | null) {
  return useQuery(integrationDeliveriesQueryOptions(id))
}
