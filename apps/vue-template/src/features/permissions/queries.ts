import { queryOptions } from '@tanstack/vue-query'

import { fetchPermissions } from './api'

// The permission registry is a fixed catalogue on the API side, so it does not
// need refetching while a page that only reads it stays open.
export const permissionsQueryOptions = queryOptions({
  queryKey: ['permissions'],
  queryFn: ({ signal }) => fetchPermissions(signal),
  staleTime: 5 * 60 * 1000,
})
