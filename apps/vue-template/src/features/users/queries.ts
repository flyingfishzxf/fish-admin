import { keepPreviousData, queryOptions } from '@tanstack/vue-query'
import { computed, unref, type MaybeRef } from 'vue'

import { fetchDepartments, fetchRoleOptions, fetchUsers, type UserListParams } from './api'

export function usersQueryOptions(params: MaybeRef<UserListParams>) {
  return queryOptions({
    queryKey: computed(() => ['users', unref(params)]),
    queryFn: ({ signal }) => fetchUsers(unref(params), signal),
    placeholderData: keepPreviousData,
  })
}

export const userOptionsQueryOptions = queryOptions({
  queryKey: ['users', 'options'],
  queryFn: async ({ signal }) => {
    const [roles, departments] = await Promise.all([
      fetchRoleOptions(signal),
      fetchDepartments(signal),
    ])
    return { roles, departments: departments.items }
  },
})
