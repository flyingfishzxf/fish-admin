import { describe, expect, it } from 'vitest'

import { ALL_PERMISSION_CODES } from '@/config/permissions'
import type { Role } from '@/types'

import {
  diffPermissions,
  expandWildcard,
  groupState,
  isImmutableRole,
  permissionsEqual,
  toggleGroupSelection,
} from './permissions'

const role = (overrides: Partial<Role>): Role => ({
  id: 'role_test',
  name: 'Test',
  description: '',
  permissions: [],
  isSystem: false,
  userCount: 0,
  ...overrides,
})

describe('role permission helpers', () => {
  it('expands the wildcard to every permission', () => {
    expect(expandWildcard(['*'])).toEqual(ALL_PERMISSION_CODES)
    expect(expandWildcard(['user:read'])).toEqual(['user:read'])
  })

  it('treats wildcard roles as immutable', () => {
    expect(isImmutableRole(role({ permissions: ['*'] }))).toBe(true)
    expect(isImmutableRole(role({ isSystem: true, permissions: ['user:read'] }))).toBe(false)
  })

  it('compares permission sets regardless of order', () => {
    expect(permissionsEqual(['a', 'b'], ['b', 'a'])).toBe(true)
    expect(permissionsEqual(['a'], ['a', 'b'])).toBe(false)
    expect(permissionsEqual(['b'], ['a'])).toBe(false)
  })

  it('diffs added and removed permissions against the wildcard', () => {
    expect(diffPermissions(['*'], ['user:read'])).toEqual({
      added: [],
      removed: ALL_PERMISSION_CODES.filter((code) => code !== 'user:read'),
    })
    expect(diffPermissions(['user:read'], ['user:read', 'role:read'])).toEqual({
      added: ['role:read'],
      removed: [],
    })
    expect(diffPermissions(['user:read', 'role:read'], [])).toEqual({
      added: [],
      removed: ['user:read', 'role:read'],
    })
  })

  it('reports group selection state', () => {
    expect(groupState([], ['a', 'b'])).toBe('none')
    expect(groupState(['a'], ['a', 'b'])).toBe('some')
    expect(groupState(['a', 'b'], ['a', 'b'])).toBe('all')
  })

  it('toggles a whole group both ways', () => {
    expect(toggleGroupSelection(['a'], ['a', 'b'])).toEqual(['a', 'b'])
    expect(toggleGroupSelection(['a', 'b'], ['a', 'b'])).toEqual([])
    expect(toggleGroupSelection(['x'], ['a', 'b'])).toEqual(['x', 'a', 'b'])
  })
})
