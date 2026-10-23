import { queryOptions, useQuery } from '@tanstack/react-query'

import type { Department } from '@/types'

import { fetchDepartments } from './api'

export const departmentsQueryOptions = () =>
  queryOptions({
    queryKey: ['departments'],
    queryFn: fetchDepartments,
    select: (data): Department[] => data.items,
  })

export function useDepartmentsQuery() {
  return useQuery(departmentsQueryOptions())
}
