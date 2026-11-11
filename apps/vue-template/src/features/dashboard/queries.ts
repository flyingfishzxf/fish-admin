import type { DashboardRange } from '@fish-admin/contracts'
import { keepPreviousData, queryOptions } from '@tanstack/vue-query'
import { computed, unref, type MaybeRef } from 'vue'

import { fetchDashboard } from './api'

export function dashboardQueryOptions(range: MaybeRef<DashboardRange>) {
  return queryOptions({
    queryKey: computed(() => ['dashboard', unref(range)]),
    queryFn: ({ signal }) => fetchDashboard(unref(range), signal),
    placeholderData: keepPreviousData,
  })
}
