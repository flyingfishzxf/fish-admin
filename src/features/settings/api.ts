import { apiRequest } from '@/lib/api-client'

export function resetDemoData() {
  return apiRequest<{ ok: boolean }>('/__mock/reset', { method: 'POST' })
}
