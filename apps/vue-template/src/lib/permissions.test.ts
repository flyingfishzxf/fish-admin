import { describe, expect, it } from 'vitest'
import { filterNavGroups, hasPermission } from './permissions'
import type { NavGroup } from '../config/nav'

const groups: NavGroup[] = [
  {
    titleKey: 'nav:groups.overview',
    items: [
      { titleKey: 'nav:items.dashboard', to: '/', icon: {} as never, permission: 'dashboard:read' },
      {
        titleKey: 'nav:items.reports',
        to: '/reports',
        icon: {} as never,
        permission: 'report:read',
      },
    ],
  },
  {
    titleKey: 'nav:groups.account',
    items: [{ titleKey: 'nav:items.profile', to: '/profile', icon: {} as never }],
  },
]

describe('permissions', () => {
  it('supports the * wildcard and resource wildcards', () => {
    expect(hasPermission(['*'], 'user:delete')).toBe(true)
    expect(hasPermission(['user:*'], 'user:delete')).toBe(true)
    expect(hasPermission(['user:read'], 'user:delete')).toBe(false)
  })

  it('filters items and drops empty groups', () => {
    const filtered = filterNavGroups(groups, ['dashboard:read'])
    expect(filtered).toHaveLength(2)
    // `/reports` is denied, the permission-free `/profile` survives in its own group.
    expect(filtered.flatMap((group) => group.items.map((item) => item.to))).toEqual([
      '/',
      '/profile',
    ])
  })
})
