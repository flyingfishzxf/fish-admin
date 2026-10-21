import type { NavGroup } from '@/config/nav'

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

export function filterNavGroups(groups: NavGroup[], granted: readonly string[]): NavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasPermission(granted, item.permission)),
    }))
    .filter((group) => group.items.length > 0)
}
