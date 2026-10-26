import type { NavGroup, NavItem } from '@/config/nav'

export function hasPermission(
  granted: readonly string[] | null | undefined,
  required?: string | null,
): boolean {
  if (!required) return true
  if (!granted || granted.length === 0) return false
  if (granted.includes('*') || granted.includes(required)) return true

  const [resource] = required.split(':')
  return Boolean(resource) && granted.includes(`${resource}:*`)
}

function filterItems(items: NavItem[], granted: readonly string[]): NavItem[] {
  return items
    .filter((item) => hasPermission(granted, item.permission))
    .map((item) =>
      item.children ? { ...item, children: filterItems(item.children, granted) } : item,
    )
}

export function filterNavGroups(groups: NavGroup[], granted: readonly string[]): NavGroup[] {
  return groups
    .map((group) => ({ ...group, items: filterItems(group.items, granted) }))
    .filter((group) => group.items.length > 0)
}
