import type { ReportData, ReportGranularity } from '@fish-admin/contracts'

import { apiRequest } from '../../lib/api-client'

export interface ReportParams {
  from?: string
  to?: string
  granularity?: ReportGranularity
}

export function fetchReports(params: ReportParams, signal?: AbortSignal) {
  const search = new URLSearchParams()
  if (params.from) search.set('from', params.from)
  if (params.to) search.set('to', params.to)
  if (params.granularity) search.set('granularity', params.granularity)
  const query = search.toString()

  return apiRequest<ReportData>(`/reports${query ? `?${query}` : ''}`, { signal })
}
