import { NAV_CONTRACT, type NavRouteContract } from '@fish-admin/contracts/navigation'
import type { PermissionCode } from '@fish-admin/contracts/permissions'
import type { LucideIcon } from 'lucide-react'

import { resolveMenuIcon } from '@/features/navigation/menu-icons'

export type AppPath = NavRouteContract['to']

interface NavItemBase {
  titleKey: string
  icon: LucideIcon
  permission?: PermissionCode
}

export interface InternalNavItem extends NavItemBase {
  to: AppPath
  // The discriminant: internal entries never carry the flag, so `item.external`
  // reads on the union and the guard narrows in both directions.
  external?: never
  children?: InternalNavItem[]
}

export interface ExternalNavItem extends NavItemBase {
  href: string
  external: true
}

export type NavItem = InternalNavItem | ExternalNavItem

export interface NavGroup {
  titleKey: string
  items: NavItem[]
}

export function isExternalNavItem(item: NavItem): item is ExternalNavItem {
  return item.external === true
}

export function internalNavItems(items: NavItem[]): InternalNavItem[] {
  return items.filter((item): item is InternalNavItem => !isExternalNavItem(item))
}

function toInternalNavItem(route: NavRouteContract): InternalNavItem {
  return {
    titleKey: route.titleKey,
    to: route.to,
    icon: resolveMenuIcon(route.icon),
    ...(route.permission ? { permission: route.permission } : {}),
  }
}

export const NAV_GROUPS: NavGroup[] = NAV_CONTRACT.map((group) => ({
  titleKey: group.titleKey,
  items: group.items.map(toInternalNavItem),
}))

export const ALL_NAV_ITEMS: InternalNavItem[] = internalNavItems(
  NAV_GROUPS.flatMap((group) => group.items),
)

// Every entry, internal and external: the command palette searches all of them.
export function flattenNavItems(groups: NavGroup[]): NavItem[] {
  return groups.flatMap((group) =>
    group.items.flatMap((item): NavItem[] =>
      isExternalNavItem(item) ? [item] : [item, ...(item.children ?? [])],
    ),
  )
}

// Internal paths only. An external entry is not a route in this build, so it is
// invisible to path matching, the 403 guard and the tab bar.
export function flattenInternalNavItems(groups: NavGroup[]): InternalNavItem[] {
  return groups.flatMap((group) =>
    group.items.flatMap((item): InternalNavItem[] =>
      isExternalNavItem(item) ? [] : [item, ...(item.children ?? [])],
    ),
  )
}

// The menu a server sends can only point at a route this build actually has:
// anything else renders the shell's 404, so a backend that lists a page this
// template no longer ships drops out here and the resolver follows automatically.
const NAV_PATHS: readonly string[] = flattenInternalNavItems(NAV_GROUPS).map((item) => item.to)

export function isAppPath(value: unknown): value is AppPath {
  return typeof value === 'string' && NAV_PATHS.includes(value)
}

/**
 * Whether a page is one the menu owns. Detail routes match their parent, so
 * hiding `/users` also makes `/users/42` unreachable; the 403 screen and the
 * 404 catch-all are not menu pages and are never redirected back to 403.
 */
export function isManagedNavPath(pathname: string) {
  return flattenInternalNavItems(NAV_GROUPS).some((item) => isPathActive(pathname, item.to))
}

export function isPathActive(pathname: string, path: AppPath) {
  if (path === '/') return pathname === '/'
  return pathname === path || pathname.startsWith(`${path}/`)
}

export function findNavGroup(pathname: string, groups: NavGroup[] = NAV_GROUPS) {
  const item = findNavItem(pathname, groups)
  return item
    ? groups.find((group) =>
        flattenInternalNavItems([group]).some((candidate) => candidate.to === item.to),
      )
    : undefined
}

export function findNavItem(pathname: string, groups: NavGroup[] = NAV_GROUPS) {
  return flattenInternalNavItems(groups)
    .filter((item) => isPathActive(pathname, item.to))
    .sort((a, b) => b.to.length - a.to.length)[0]
}
