import { keepPreviousData, queryOptions } from '@tanstack/vue-query'

import { fetchRoles } from './api'

export const rolesQueryOptions = queryOptions({
  queryKey: ['roles'],
  queryFn: ({ signal }) => fetchRoles(signal),
  placeholderData: keepPreviousData,
})
