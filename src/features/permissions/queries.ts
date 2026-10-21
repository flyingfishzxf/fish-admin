import { queryOptions, useQuery } from '@tanstack/react-query'

import { fetchPermissions } from './api'

export const permissionsQueryOptions = () =>
  queryOptions({
    queryKey: ['permissions'],
    queryFn: fetchPermissions,
  })

export function usePermissionsQuery() {
  return useQuery(permissionsQueryOptions())
}
