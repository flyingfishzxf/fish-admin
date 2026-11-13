import type { Role, RoleOption } from '@fish-admin/contracts'
import type { PermissionDefinition } from '@fish-admin/contracts/permissions'

import { apiRequest } from '../../lib/api-client'

export interface RoleInput {
  name: string
  description?: string
}

// `GET /roles` returns the whole array (no paging or search parameter), so the
// page filters and pages client-side. `permissions` is deliberately omitted on
// create: this slice uses a single dialog and the matrix (Task 5) grants access.
export function fetchRoles(signal?: AbortSignal) {
  return apiRequest<Role[]>('/roles', { signal })
}

export function fetchRoleOptions(signal?: AbortSignal) {
  return apiRequest<RoleOption[]>('/roles/options', { signal })
}

export function createRole(input: RoleInput) {
  return apiRequest<Role>('/roles', { method: 'POST', body: input })
}

export function updateRole(id: string, input: Partial<RoleInput>) {
  return apiRequest<Role>(`/roles/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: input,
  })
}

export function deleteRole(id: string) {
  return apiRequest<void>(`/roles/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

// `GET /permissions` requires `permission:read`, not `role:read`, and returns the
// whole registry. The matrix needs it to group codes; Task 6 renders it directly.
export function fetchPermissions(signal?: AbortSignal) {
  return apiRequest<PermissionDefinition[]>('/permissions', { signal })
}

export function updateRolePermissions(id: string, permissions: string[]) {
  return apiRequest<Role>(`/roles/${encodeURIComponent(id)}/permissions`, {
    method: 'PUT',
    body: { permissions },
  })
}
