import { apiRequest } from '@/lib/api-client'
import type { PaginatedResult, User, UserInput, UserStatus } from '@/types'

export interface UserListParams {
  page: number
  pageSize: number
  q?: string
  roleId?: string
  status?: string
  sort?: string
  order?: string
}

export function fetchUsers(params: UserListParams) {
  const search = new URLSearchParams()
  search.set('page', String(params.page))
  search.set('pageSize', String(params.pageSize))
  if (params.q) search.set('q', params.q)
  if (params.roleId) search.set('roleId', params.roleId)
  if (params.status) search.set('status', params.status)
  if (params.sort) search.set('sort', params.sort)
  if (params.order) search.set('order', params.order)

  return apiRequest<PaginatedResult<User>>(`/users?${search.toString()}`)
}

export function createUser(input: UserInput) {
  return apiRequest<User>('/users', { method: 'POST', body: input })
}

export function updateUser(id: string, input: UserInput) {
  return apiRequest<User>(`/users/${id}`, { method: 'PATCH', body: input })
}

export function deleteUser(id: string) {
  return apiRequest<void>(`/users/${id}`, { method: 'DELETE' })
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
