import type { DashboardData, DashboardRange } from '@/types'
import { apiRequest } from '@/lib/api-client'

export function fetchDashboard(range: DashboardRange) {
  return apiRequest<DashboardData>(`/dashboard?range=${range}`)
}
