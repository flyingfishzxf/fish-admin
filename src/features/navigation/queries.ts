import { useQuery, queryOptions } from '@tanstack/react-query'
import { useMemo } from 'react'

import { useAuthStore } from '@/stores/auth-store'

import { fetchMenu } from './api'
import { resolveMenuGroups } from './resolve'

const NO_PERMISSIONS: string[] = []

/**
 * The menu belongs to the session, so it is keyed once and cleared with it:
 * `auth-store` calls `queryClient.clear()` on login, logout and an unrecoverable
 * 401. `retry` is off because the route guard waits on this query, and a second
 * attempt would be a second block before the shipped nav takes over.
 */
export const menuQueryOptions = (timeoutMs?: number) =>
  queryOptions({
    queryKey: ['menu'],
    // Logging out clears the cache, which wakes the shell's observer one last
    // time with no token to send. There is no menu for a signed-out session, so
    // the request never leaves instead of answering 401.
    queryFn: async ({ signal }) =>
      useAuthStore.getState().accessToken ? fetchMenu(signal, timeoutMs) : null,
    staleTime: 5 * 60_000,
    retry: false,
  })

/** Sidebar, command palette and breadcrumbs all read the menu through this. */
export function useMenuNavGroups() {
  const permissions = useAuthStore((state) => state.user?.permissions ?? NO_PERMISSIONS)
  const { data } = useQuery(menuQueryOptions())

  return useMemo(() => resolveMenuGroups(data, permissions), [data, permissions])
}
