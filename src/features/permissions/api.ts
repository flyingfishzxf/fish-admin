import type { PermissionDefinition } from '@/config/permissions'
import { apiRequest } from '@/lib/api-client'

export function fetchPermissions(signal?: AbortSignal) {
  return apiRequest<PermissionDefinition[]>('/permissions', { signal })
}
