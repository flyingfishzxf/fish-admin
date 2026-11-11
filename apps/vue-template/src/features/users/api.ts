import type {
  Department,
  PaginatedResult,
  RoleOption,
  User,
  UserInput,
  UserStatus,
} from '@fish-admin/contracts'

import { apiRequest } from '../../lib/api-client'

import type { SortOrder, UserSortKey } from './search'

export interface UserListParams {
  page: number
  pageSize: number
  q?: string
  status?: UserStatus
  sort?: UserSortKey
  order?: SortOrder
}

export function fetchUsers(params: UserListParams, signal?: AbortSignal) {
  const search = new URLSearchParams()
  search.set('page', String(params.page))
  search.set('pageSize', String(params.pageSize))
  if (params.q) search.set('q', params.q)
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

export function updateUser(id: string, input: UserInput) {
  return apiRequest<User>(`/users/${encodeURIComponent(id)}`, { method: 'PATCH', body: input })
}

export function deleteUser(id: string) {
  return apiRequest<void>(`/users/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export type { PaginatedResult }
