import type {
  AuditEvent,
  Department,
  DictionaryDetail,
  PaginatedResult,
  RoleOption,
  User,
  UserInput,
  UserProfileInput,
  UserStatus,
} from '@fish-admin/contracts'

import { apiRequest } from '../../lib/api-client'

import type { SortOrder, UserSortKey } from './search'

export interface UserListParams {
  page: number
  pageSize: number
  q?: string
  roleId?: string
  status?: UserStatus
  sort?: UserSortKey
  order?: SortOrder
}

export function fetchUsers(params: UserListParams, signal?: AbortSignal) {
  const search = new URLSearchParams()
  search.set('page', String(params.page))
  search.set('pageSize', String(params.pageSize))
  if (params.q) search.set('q', params.q)
  if (params.roleId) search.set('roleId', params.roleId)
  if (params.status) search.set('status', params.status)
  if (params.sort) search.set('sort', params.sort)
  if (params.order) search.set('order', params.order)

  return apiRequest<PaginatedResult<User>>(`/users?${search.toString()}`, { signal })
}

export function fetchRoleOptions(signal?: AbortSignal) {
  return apiRequest<RoleOption[]>('/roles/options', { signal })
}

export function fetchDepartments(signal?: AbortSignal) {
  return apiRequest<{ items: Department[] }>('/departments', { signal })
}

export function createUser(input: UserInput) {
  return apiRequest<User>('/users', { method: 'POST', body: input })
}

export function fetchUser(id: string, signal?: AbortSignal) {
  return apiRequest<User>(`/users/${encodeURIComponent(id)}`, { signal })
}

/** The detail page only ever sends changed fields; a full UserInput would
 * re-validate the role and the email on a tag or avatar edit. */
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

/** Enabled `user_tag` entries are the tag suggestions on the detail page. */
export function fetchUserTagOptions(signal?: AbortSignal) {
  return apiRequest<DictionaryDetail>('/dictionaries/user_tag', { signal })
}

export function updateUser(id: string, input: UserInput) {
  return apiRequest<User>(`/users/${encodeURIComponent(id)}`, { method: 'PATCH', body: input })
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

export type { PaginatedResult }
