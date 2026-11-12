import { queryOptions } from '@tanstack/vue-query'

import { fetchDepartments } from './api'

export const departmentsQueryOptions = queryOptions({
  queryKey: ['departments'],
  queryFn: ({ signal }) => fetchDepartments(signal),
})
