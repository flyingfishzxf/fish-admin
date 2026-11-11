import type { UserStatus } from '@fish-admin/contracts'

export type UserSortKey = 'name' | 'createdAt'
export type SortOrder = 'asc' | 'desc'

export interface UsersSearch {
  page: number
  pageSize: number
  q?: string
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
