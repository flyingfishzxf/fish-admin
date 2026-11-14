import type { UserStatus } from '@fish-admin/contracts'

// The mock sorts on these five keys; the column ids in `columns.ts` use the
// same strings so a header's `id` can be written straight into `search.sort`.
export type UserSortKey = 'name' | 'email' | 'role' | 'createdAt' | 'lastActiveAt'
export type SortOrder = 'asc' | 'desc'

export const USER_STATUSES: UserStatus[] = ['active', 'invited', 'inactive']

export interface UsersSearch {
  page: number
  pageSize: number
  q?: string
  roleId?: string
  status?: UserStatus
  sort: UserSortKey
  order: SortOrder
}

export const DEFAULT_USERS_SEARCH: UsersSearch = {
  page: 1,
  pageSize: 10,
  sort: 'createdAt',
  order: 'desc',
}
