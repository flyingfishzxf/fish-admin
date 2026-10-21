import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'

import { fetchUsers, type UserListParams } from './api'

export const userListQueryOptions = (params: UserListParams) =>
  queryOptions({
    queryKey: ['users', params],
    queryFn: () => fetchUsers(params),
    placeholderData: keepPreviousData,
  })

export function useUserListQuery(params: UserListParams) {
  return useQuery(userListQueryOptions(params))
}
