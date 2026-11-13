import type { Role } from '@fish-admin/contracts'
import { ALL_PERMISSION_CODES } from '@fish-admin/contracts/permissions'
import { describe, expect, it } from 'vitest'

import {
  expandWildcard,
  groupState,
  isImmutableRole,
  permissionsEqual,
  toggleGroupSelection,
} from './permissions'

function role(permissions: string[]): Role {
  return {
    id: 'r1',
    name: 'Role',
    description: '',
    permissions,
    isSystem: false,
    userCount: 0,
  }
}

describe('role permission helpers', () => {
  it('expands the wildcard to every known code', () => {
    expect(expandWildcard(['*'])).toEqual([...ALL_PERMISSION_CODES])
    expect(expandWildcard(['user:read'])).toEqual(['user:read'])
    expect(expandWildcard([])).toEqual([])
  })

  it('treats only a wildcard role as immutable', () => {
    expect(isImmutableRole(role(['*']))).toBe(true)
    expect(isImmutableRole(role(['user:read']))).toBe(false)
  })

  it('compares permission sets regardless of order', () => {
    expect(permissionsEqual(['a', 'b'], ['b', 'a'])).toBe(true)
    expect(permissionsEqual(['a'], ['a', 'b'])).toBe(false)
    expect(permissionsEqual(['a', 'b'], ['a', 'c'])).toBe(false)
    expect(permissionsEqual([], [])).toBe(true)
  })

  it('reports group state from the selected codes', () => {
    expect(groupState([], ['a', 'b'])).toBe('none')
    expect(groupState(['a'], ['a', 'b'])).toBe('some')
    expect(groupState(['a', 'b'], ['a', 'b'])).toBe('all')
    expect(groupState(['a'], [])).toBe('none')
  })

  it('selects the whole group or clears it', () => {
    expect(toggleGroupSelection(['a'], ['a', 'b'])).toEqual(['a', 'b'])
    expect(toggleGroupSelection(['a', 'b'], ['a', 'b'])).toEqual([])
    // Codes outside the group survive both directions.
    expect(toggleGroupSelection(['z'], ['a'])).toEqual(['z', 'a'])
    expect(toggleGroupSelection(['a', 'z'], ['a'])).toEqual(['z'])
  })
})
