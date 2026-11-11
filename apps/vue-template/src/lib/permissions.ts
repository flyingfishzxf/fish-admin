import { hasPermission } from '@fish-admin/contracts/permissions'

import type { NavGroup } from '../config/nav'

export { hasPermission }

export function filterNavGroups(groups: NavGroup[], granted: readonly string[]): NavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasPermission(granted, item.permission)),
    }))
    .filter((group) => group.items.length > 0)
}
