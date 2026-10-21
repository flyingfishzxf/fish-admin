import type { PermissionDefinition } from '@/config/permissions'
import { apiRequest } from '@/lib/api-client'

export function fetchPermissions() {
  return apiRequest<PermissionDefinition[]>('/permissions')
}
