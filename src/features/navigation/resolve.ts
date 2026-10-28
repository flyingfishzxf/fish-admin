import { NAV_GROUPS, isAppPath, type InternalNavItem, type NavGroup } from '@/config/nav'
import type { PermissionCode } from '@/config/permissions'
import { docsNavItem } from '@/config/site'
import { filterNavGroups } from '@/lib/permissions'

import { resolveMenuIcon } from './menu-icons'
import type { MenuGroupPayload, MenuPayload, MenuRoutePayload } from './api'

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined
}

function toNavItem(route: MenuRoutePayload): InternalNavItem | undefined {
  if (!route || typeof route.titleKey !== 'string' || route.titleKey === '') return undefined
  // A path the build does not have can only render the shell's 404, so it is
  // dropped rather than linked to.
  if (!isAppPath(route.path)) return undefined

  const children = Array.isArray(route.children)
    ? route.children.map(toNavItem).filter(isDefined)
    : undefined

  return {
    titleKey: route.titleKey,
    to: route.path,
    icon: resolveMenuIcon(route.icon),
    // The wire format carries whatever string the backend chose; the static nav
    // keeps the literal union, so the cast lives at this boundary only.
    permission:
      typeof route.permission === 'string' ? (route.permission as PermissionCode) : undefined,
    children: children && children.length > 0 ? children : undefined,
  }
}

function toNavGroup(group: MenuGroupPayload): NavGroup | undefined {
  if (!group || typeof group.titleKey !== 'string' || !Array.isArray(group.items)) {
    return undefined
  }

  const items = group.items.map(toNavItem).filter(isDefined)
  return items.length > 0 ? { titleKey: group.titleKey, items } : undefined
}

/**
 * The docs live outside this build, so the entry is appended client-side rather
 * than served: a backend that does not know about it still shows it, and an
 * unset VITE_DOCS_URL still hides it.
 */
function withDocsEntry(groups: NavGroup[]): NavGroup[] {
  const docs = docsNavItem()
  if (!docs || groups.length === 0) return groups
  const index = groups.findIndex((group) => group.titleKey === 'nav:groups.overview')
  const at = index === -1 ? 0 : index
  return groups.map((group, position) =>
    position === at ? { ...group, items: [...group.items, docs] } : group,
  )
}

/**
 * The one place the menu is decided. A backend without `GET /menu` (404), a
 * request that never landed, or a payload with nothing renderable all fall back
 * to the nav the build ships with, so the app stays navigable offline and
 * against an API that has not implemented the endpoint yet.
 */
export function resolveMenuGroups(
  payload: MenuPayload | null | undefined,
  granted: readonly string[],
): NavGroup[] {
  const groups = Array.isArray(payload?.groups)
    ? payload.groups.map(toNavGroup).filter(isDefined)
    : []

  return filterNavGroups(withDocsEntry(groups.length > 0 ? groups : NAV_GROUPS), granted)
}
