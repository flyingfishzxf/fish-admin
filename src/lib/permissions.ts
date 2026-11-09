import { hasPermission } from '@fish-admin/contracts/permissions'

import { internalNavItems, isExternalNavItem, type NavGroup, type NavItem } from '@/config/nav'

export { hasPermission }

function filterItems(items: NavItem[], granted: readonly string[]): NavItem[] {
  return items
    .filter((item) => hasPermission(granted, item.permission))
    .map((item) =>
      !isExternalNavItem(item) && item.children
        ? // Children are internal by construction; the helper keeps that type.
          { ...item, children: internalNavItems(filterItems(item.children, granted)) }
        : item,
    )
}

export function filterNavGroups(groups: NavGroup[], granted: readonly string[]): NavGroup[] {
  return groups
    .map((group) => ({ ...group, items: filterItems(group.items, granted) }))
    .filter((group) => group.items.length > 0)
}
