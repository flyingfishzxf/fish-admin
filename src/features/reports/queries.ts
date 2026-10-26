import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'

import { fetchReport, type ReportParams } from './api'

export const reportQueryOptions = (params: ReportParams) =>
  queryOptions({
    queryKey: ['reports', params],
    queryFn: ({ signal }) => fetchReport(params, signal),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })

export function useReportQuery(params: ReportParams) {
  return useQuery(reportQueryOptions(params))
}
