import { queryOptions, useQuery } from '@tanstack/react-query'

import { fetchRoleOptions, fetchRoles } from './api'

export const rolesQueryOptions = () =>
  queryOptions({
    queryKey: ['roles'],
    queryFn: fetchRoles,
  })

export const roleOptionsQueryOptions = () =>
  queryOptions({
    queryKey: ['roles', 'options'],
    queryFn: fetchRoleOptions,
  })

export function useRolesQuery() {
  return useQuery(rolesQueryOptions())
}

export function useRoleOptionsQuery() {
  return useQuery(roleOptionsQueryOptions())
}
