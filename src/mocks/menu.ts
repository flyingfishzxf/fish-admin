import { NAV_GROUPS, internalNavItems, type InternalNavItem } from '@/config/nav'
import type { MenuGroupPayload, MenuPayload, MenuRoutePayload } from '@/features/navigation/api'
import { iconNameFor } from '@/features/navigation/menu-icons'

function toRoute(item: InternalNavItem): MenuRoutePayload {
  return {
    titleKey: item.titleKey,
    path: item.to,
    icon: iconNameFor(item.icon) ?? 'circle-dot',
    ...(item.permission ? { permission: item.permission } : {}),
  }
}

/**
 * Serialized from the shipped nav so the demo and the offline fallback cannot
 * drift. Every entry carries its permission code, so the client can re-check it
 * against the session; the server here has no reason to hide anything.
 */
export function buildMenuPayload(): MenuPayload {
  const groups = NAV_GROUPS.map((group): MenuGroupPayload => ({
    titleKey: group.titleKey,
    // The wire format only carries routes, and the docs entry is appended
    // client-side, so this serializes the internal items alone.
    items: internalNavItems(group.items).map(toRoute),
  }))

  return { groups }
}
