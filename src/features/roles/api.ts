import { apiRequest } from '@/lib/api-client'
import type { Role, RoleOption } from '@/types'

export function fetchRoles() {
  return apiRequest<Role[]>('/roles')
}

export function fetchRoleOptions() {
  return apiRequest<RoleOption[]>('/roles/options')
}

export function updateRolePermissions(roleId: string, permissions: string[]) {
  return apiRequest<Role>(`/roles/${roleId}/permissions`, {
    method: 'PUT',
    body: { permissions },
  })
}
