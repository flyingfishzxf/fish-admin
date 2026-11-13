import type { Role } from '@fish-admin/contracts'
import { ALL_PERMISSION_CODES } from '@fish-admin/contracts/permissions'

export type GroupState = 'none' | 'some' | 'all'

// The seeded admin role stores a `*` wildcard instead of every code. The matrix
// edits concrete codes, so expand it before diffing or rendering.
export function expandWildcard(permissions: readonly string[]): string[] {
  return permissions.includes('*') ? [...ALL_PERMISSION_CODES] : [...permissions]
}

// A wildcard role always holds every permission; the API rejects writes to it
// with PROTECTED_ROLE, so the matrix renders it as locked instead of editable.
export function isImmutableRole(role: Role): boolean {
  return role.permissions.includes('*')
}

export function permissionsEqual(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false
  const rightSet = new Set(right)
  return left.every((permission) => rightSet.has(permission))
}

export function groupState(selected: readonly string[], codes: readonly string[]): GroupState {
  if (codes.length === 0) return 'none'
  const selectedSet = new Set(selected)
  const count = codes.filter((code) => selectedSet.has(code)).length
  if (count === 0) return 'none'
  if (count === codes.length) return 'all'
  return 'some'
}

export function toggleGroupSelection(
  selected: readonly string[],
  codes: readonly string[],
): string[] {
  if (groupState(selected, codes) === 'all') {
    const removing = new Set(codes)
    return selected.filter((code) => !removing.has(code))
  }
  return [...new Set([...selected, ...codes])]
}
