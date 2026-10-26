import { queryOptions, useQuery } from '@tanstack/react-query'

import { fetchPermissions } from './api'

export const permissionsQueryOptions = () =>
  queryOptions({
    queryKey: ['permissions'],
    queryFn: ({ signal }) => fetchPermissions(signal),
  })

export function usePermissionsQuery(enabled = true) {
  return useQuery({ ...permissionsQueryOptions(), enabled })
}
