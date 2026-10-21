import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'

import type { DashboardRange } from '@/types'

import { fetchDashboard } from './api'

export const dashboardQueryOptions = (range: DashboardRange) =>
  queryOptions({
    queryKey: ['dashboard', range],
    queryFn: () => fetchDashboard(range),
    placeholderData: keepPreviousData,
  })

export function useDashboardQuery(range: DashboardRange) {
  return useQuery(dashboardQueryOptions(range))
}
