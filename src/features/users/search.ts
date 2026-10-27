import type { UserStatus } from '@/types'

export type UserSortKey = 'name' | 'email' | 'role' | 'createdAt' | 'lastActiveAt'
export type SortOrder = 'asc' | 'desc'

export interface UsersSearch {
  page: number
  pageSize: number
  q?: string
  roleId?: string
  status?: UserStatus
  sort: UserSortKey
  order: SortOrder
  dataset?: 'large'
}

const SORT_KEYS: UserSortKey[] = ['name', 'email', 'role', 'createdAt', 'lastActiveAt']
const STATUSES: UserStatus[] = ['active', 'invited', 'inactive']

export const DEFAULT_USERS_SEARCH: UsersSearch = {
  page: 1,
  pageSize: 10,
  sort: 'createdAt',
  order: 'desc',
}

export function validateUsersSearch(search: Record<string, unknown>): UsersSearch {
  const page = Number(search.page)
  const pageSize = Number(search.pageSize)
  const sort = SORT_KEYS.includes(search.sort as UserSortKey)
    ? (search.sort as UserSortKey)
    : 'createdAt'
  const order: SortOrder = search.order === 'asc' ? 'asc' : 'desc'
  const status = STATUSES.includes(search.status as UserStatus)
    ? (search.status as UserStatus)
    : undefined
  const dataset = search.dataset === 'large' ? 'large' : undefined

  return {
    page: Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1,
    pageSize:
      dataset === 'large'
        ? 5000
        : Number.isFinite(pageSize) && pageSize >= 5 && pageSize <= 100
          ? Math.floor(pageSize)
          : 10,
    q: typeof search.q === 'string' && search.q.trim() ? search.q.trim() : undefined,
    roleId: typeof search.roleId === 'string' && search.roleId ? search.roleId : undefined,
    status,
    sort,
    order,
    ...(dataset ? { dataset } : {}),
  }
}
