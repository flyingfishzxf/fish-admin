import { apiRequest } from '@/lib/api-client'
import type {
  AuditEvent,
  PaginatedResult,
  User,
  UserInput,
  UserProfileInput,
  UserStatus,
} from '@/types'

export interface UserListParams {
  page: number
  pageSize: number
  q?: string
  roleId?: string
  status?: string
  departmentId?: string
  includeDescendants?: boolean
  sort?: string
  order?: string
}

export function fetchUsers(params: UserListParams, signal?: AbortSignal) {
  const search = new URLSearchParams()
  search.set('page', String(params.page))
  search.set('pageSize', String(params.pageSize))
  if (params.q) search.set('q', params.q)
  if (params.roleId) search.set('roleId', params.roleId)
  if (params.status) search.set('status', params.status)
  if (params.departmentId) search.set('departmentId', params.departmentId)
  if (params.includeDescendants) search.set('includeDescendants', '1')
  if (params.sort) search.set('sort', params.sort)
  if (params.order) search.set('order', params.order)

  return apiRequest<PaginatedResult<User>>(`/users?${search.toString()}`, { signal })
}

export function createUser(input: UserInput) {
  return apiRequest<User>('/users', { method: 'POST', body: input })
}

export interface UserImportRow {
  name: string
  email: string
  role?: string
  department?: string
}

export interface UserImportResult {
  created: User[]
  skipped: Array<{ email: string; message: string }>
}

export function importUsers(rows: UserImportRow[]) {
  return apiRequest<UserImportResult>('/users/import', {
    method: 'POST',
    body: { users: rows },
  })
}

export function fetchUser(id: string, signal?: AbortSignal) {
  return apiRequest<User>(`/users/${encodeURIComponent(id)}`, { signal })
}

export function updateUser(id: string, input: UserInput) {
  return apiRequest<User>(`/users/${encodeURIComponent(id)}`, { method: 'PATCH', body: input })
}

export function updateUserProfile(id: string, input: UserProfileInput) {
  return apiRequest<User>(`/users/${encodeURIComponent(id)}`, { method: 'PATCH', body: input })
}

export function fetchUserActivity(id: string, limit = 20, signal?: AbortSignal) {
  const search = new URLSearchParams({
    entityType: 'user',
    entityId: id,
    page: '1',
    pageSize: String(limit),
  })
  return apiRequest<PaginatedResult<AuditEvent>>(`/audit-events?${search.toString()}`, { signal })
}

export function deleteUser(id: string) {
  return apiRequest<void>(`/users/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export interface BulkStatusResult {
  updated: string[]
  skipped: string[]
}

export interface BulkDeleteResult {
  deleted: string[]
  skipped: string[]
}

export function bulkUpdateUserStatus(ids: string[], status: UserStatus) {
  return apiRequest<BulkStatusResult>('/users/bulk-status', {
    method: 'POST',
    body: { ids, status },
  })
}

export function bulkDeleteUsers(ids: string[]) {
  return apiRequest<BulkDeleteResult>('/users/bulk-delete', {
    method: 'POST',
    body: { ids },
  })
}

export function restoreUsers(ids: string[]) {
  return apiRequest<{ restored: User[] }>('/users/restore', {
    method: 'POST',
    body: { ids },
  })
}
