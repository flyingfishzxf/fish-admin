import { NAV_GROUPS, type NavItem } from '@/config/nav'
import type { MenuGroupPayload, MenuPayload, MenuRoutePayload } from '@/features/navigation/api'
import { iconNameFor } from '@/features/navigation/menu-icons'

/**
 * The template's own design-system surfaces ride on the menu only for the
 * full-access demo role. Nothing in the client's permission codes hides them —
 * `/ui` and `/components` carry no `permission` — so this is the one place where
 * the server, rather than the session, decides what the sidebar shows.
 */
const WILDCARD_ONLY_PATHS: readonly string[] = ['/ui', '/components']

function toRoute(item: NavItem, wildcard: boolean): MenuRoutePayload | undefined {
  if (!wildcard && WILDCARD_ONLY_PATHS.includes(item.to)) return undefined

  return {
    titleKey: item.titleKey,
    path: item.to,
    icon: iconNameFor(item.icon) ?? 'circle-dot',
    ...(item.permission ? { permission: item.permission } : {}),
  }
}

/** Serialized from the shipped nav so the demo and the offline fallback cannot drift. */
export function buildMenuPayload(permissions: readonly string[]): MenuPayload {
  const wildcard = permissions.includes('*')

  const groups = NAV_GROUPS.map((group): MenuGroupPayload => {
    const items = group.items
      .map((item) => toRoute(item, wildcard))
      .filter((item): item is MenuRoutePayload => item !== undefined)

    return { titleKey: group.titleKey, items }
  }).filter((group) => group.items.length > 0)

  return { groups }
}
