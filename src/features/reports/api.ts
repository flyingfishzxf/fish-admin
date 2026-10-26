import type { ReportData, ReportGranularity } from '@/types'
import { apiRequest } from '@/lib/api-client'

export interface ReportParams {
  from: string
  to: string
  granularity: ReportGranularity
}

export function fetchReport(params: ReportParams, signal?: AbortSignal) {
  const search = new URLSearchParams()
  search.set('from', params.from)
  search.set('to', params.to)
  search.set('granularity', params.granularity)

  return apiRequest<ReportData>(`/reports?${search.toString()}`, { signal })
}
