import { apiRequest } from '@/lib/api-client'
import type { Role, RoleOption } from '@/types'

export interface RoleInput {
  name: string
  description?: string
  permissions?: string[]
}

export interface RoleUpdateInput {
  name?: string
  description?: string
}

export function fetchRoles(signal?: AbortSignal) {
  return apiRequest<Role[]>('/roles', { signal })
}

export function fetchRoleOptions(signal?: AbortSignal) {
  return apiRequest<RoleOption[]>('/roles/options', { signal })
}

export function createRole(input: RoleInput) {
  return apiRequest<Role>('/roles', { method: 'POST', body: input })
}

export function updateRole(roleId: string, input: RoleUpdateInput) {
  return apiRequest<Role>(`/roles/${encodeURIComponent(roleId)}`, {
    method: 'PATCH',
    body: input,
  })
}

export function deleteRole(roleId: string) {
  return apiRequest<void>(`/roles/${encodeURIComponent(roleId)}`, { method: 'DELETE' })
}

export function updateRolePermissions(roleId: string, permissions: string[]) {
  return apiRequest<Role>(`/roles/${encodeURIComponent(roleId)}/permissions`, {
    method: 'PUT',
    body: { permissions },
  })
}
