import { keepPreviousData, queryOptions } from '@tanstack/vue-query'

import { fetchPermissions, fetchRoles } from './api'

export const rolesQueryOptions = queryOptions({
  queryKey: ['roles'],
  queryFn: ({ signal }) => fetchRoles(signal),
  placeholderData: keepPreviousData,
})

// The permission registry is a fixed catalogue on the API side, so it does not
// need refetching while the matrix stays open.
export const permissionsQueryOptions = queryOptions({
  queryKey: ['permissions'],
  queryFn: ({ signal }) => fetchPermissions(signal),
  staleTime: 5 * 60 * 1000,
})
