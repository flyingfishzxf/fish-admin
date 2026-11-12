import { keepPreviousData, queryOptions } from '@tanstack/vue-query'
import { computed, unref, type MaybeRef } from 'vue'

import { fetchReports, type ReportParams } from './api'

export function reportsQueryOptions(params: MaybeRef<ReportParams>) {
  return queryOptions({
    queryKey: computed(() => ['reports', unref(params)]),
    queryFn: ({ signal }) => fetchReports(unref(params), signal),
    placeholderData: keepPreviousData,
  })
}
