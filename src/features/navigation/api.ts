import type { MenuPayload } from '@fish-admin/contracts/navigation'

import { apiRequest } from '@/lib/api-client'

export type {
  MenuGroupPayload,
  MenuPayload,
  MenuRoutePayload,
} from '@fish-admin/contracts/navigation'

export function fetchMenu(signal?: AbortSignal, timeoutMs?: number) {
  return apiRequest<MenuPayload>('/menu', { signal, timeoutMs })
}
