import { queryOptions, useQuery } from '@tanstack/react-query'

import { fetchRoleOptions, fetchRoles } from './api'

export const rolesQueryOptions = () =>
  queryOptions({
    queryKey: ['roles'],
    queryFn: ({ signal }) => fetchRoles(signal),
  })

export const roleOptionsQueryOptions = () =>
  queryOptions({
    queryKey: ['roles', 'options'],
    queryFn: ({ signal }) => fetchRoleOptions(signal),
  })

export function useRolesQuery() {
  return useQuery(rolesQueryOptions())
}

export function useRoleOptionsQuery() {
  return useQuery(roleOptionsQueryOptions())
}
