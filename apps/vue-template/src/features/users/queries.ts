import { keepPreviousData, queryOptions } from '@tanstack/vue-query'
import { computed, unref, type MaybeRef } from 'vue'

import {
  fetchDepartments,
  fetchRoleOptions,
  fetchUser,
  fetchUserActivity,
  fetchUsers,
  fetchUserTagOptions,
  type UserListParams,
} from './api'

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

/** The key carries the id, so navigating between users cannot show the last
 * user's detail while the new request is in flight. */
export function userDetailQueryOptions(id: MaybeRef<string>) {
  return queryOptions({
    queryKey: computed(() => ['users', 'detail', unref(id)]),
    queryFn: ({ signal }) => fetchUser(unref(id), signal),
  })
}

export function userActivityQueryOptions(id: MaybeRef<string>, enabled: MaybeRef<boolean> = true) {
  return queryOptions({
    queryKey: computed(() => ['users', 'activity', unref(id)]),
    queryFn: ({ signal }) => fetchUserActivity(unref(id), 20, signal),
    enabled: computed(() => unref(enabled)),
  })
}

export const userTagOptionsQueryOptions = queryOptions({
  queryKey: ['users', 'tag-options'],
  queryFn: ({ signal }) => fetchUserTagOptions(signal),
})
