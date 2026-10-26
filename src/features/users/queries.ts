import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'

import { fetchUser, fetchUserActivity, fetchUsers, type UserListParams } from './api'

export const userListQueryOptions = (params: UserListParams) =>
  queryOptions({
    queryKey: ['users', params],
    queryFn: ({ signal }) => fetchUsers(params, signal),
    placeholderData: keepPreviousData,
  })

export function useUserListQuery(params: UserListParams) {
  return useQuery(userListQueryOptions(params))
}

export const userDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['users', 'detail', id],
    queryFn: ({ signal }) => fetchUser(id, signal),
  })

export function useUserDetailQuery(id: string) {
  return useQuery(userDetailQueryOptions(id))
}

export const userActivityQueryOptions = (id: string, enabled = true) =>
  queryOptions({
    queryKey: ['users', 'activity', id],
    queryFn: ({ signal }) => fetchUserActivity(id, 20, signal),
    enabled,
  })

export function useUserActivityQuery(id: string, enabled = true) {
  return useQuery(userActivityQueryOptions(id, enabled))
}
