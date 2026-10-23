import { ALL_PERMISSION_CODES } from '@/config/permissions'
import type { Role } from '@/types'

export function expandWildcard(permissions: string[]) {
  return permissions.includes('*') ? [...ALL_PERMISSION_CODES] : permissions
}

export function isImmutableRole(role: Role) {
  return role.permissions.includes('*')
}

export function permissionsEqual(left: string[], right: string[]) {
  if (left.length !== right.length) return false
  const rightSet = new Set(right)
  return left.every((permission) => rightSet.has(permission))
}

export function diffPermissions(current: string[], next: string[]) {
  const currentSet = new Set(expandWildcard(current))
  const nextSet = new Set(next)

  return {
    added: [...nextSet].filter((permission) => !currentSet.has(permission)),
    removed: [...currentSet].filter((permission) => !nextSet.has(permission)),
  }
}

export function groupState(selected: readonly string[], codes: readonly string[]) {
  if (codes.length === 0) return 'none' as const
  const selectedSet = new Set(selected)
  const count = codes.filter((code) => selectedSet.has(code)).length
  if (count === 0) return 'none' as const
  if (count === codes.length) return 'all' as const
  return 'some' as const
}

export function toggleGroupSelection(selected: readonly string[], codes: readonly string[]) {
  const allSelected = groupState(selected, codes) === 'all'

  if (allSelected) {
    const removing = new Set(codes)
    return selected.filter((code) => !removing.has(code))
  }

  return [...new Set([...selected, ...codes])]
}
