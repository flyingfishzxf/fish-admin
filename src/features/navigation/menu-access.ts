import { redirect } from '@tanstack/react-router'

import { findNavItem, isManagedNavPath } from '@/config/nav'
import { queryClient } from '@/lib/query-client'
import { useAuthStore } from '@/stores/auth-store'

import { menuQueryOptions } from './queries'
import { resolveMenuGroups } from './resolve'

const NO_PERMISSIONS: string[] = []

/** How long a navigation waits for `GET /menu` before the shipped nav takes over. */
export const MENU_ACCESS_BUDGET_MS = 2_000

interface MenuGuardContext {
  location: { pathname: string }
}

async function loadMenu() {
  try {
    return await queryClient.fetchQuery(menuQueryOptions(MENU_ACCESS_BUDGET_MS))
  } catch {
    // A backend without the endpoint, an unreachable API, a slow one: the nav
    // this build ships with keeps the app navigable.
    return null
  }
}

/**
 * Menu, routes and the 403 screen read the same list: whatever the menu does not
 * carry is not reachable, including pages a session's permission codes alone
 * would still allow. Client-side RBAC is still only a UX layer — see
 * `docs/{en,zh-CN}/rbac.md`.
 */
export async function enforceMenuAccess(context: MenuGuardContext) {
  if (!isManagedNavPath(context.location.pathname)) return

  const permissions = useAuthStore.getState().user?.permissions ?? NO_PERMISSIONS
  const groups = resolveMenuGroups(await loadMenu(), permissions)

  if (findNavItem(context.location.pathname, groups)) return

  throw redirect({ to: '/403', replace: true })
}
