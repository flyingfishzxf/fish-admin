import { BookOpen, LayoutDashboard, ShieldCheck, UserRound, Users } from 'lucide-react'
import { describe, expect, it } from 'vitest'

import { internalNavItems, type NavGroup } from '@/config/nav'
import { filterNavGroups, hasPermission } from '@/lib/permissions'

describe('hasPermission', () => {
  it('allows everything when no permission is required', () => {
    expect(hasPermission(undefined, undefined)).toBe(true)
    expect(hasPermission(undefined, null)).toBe(true)
    expect(hasPermission(undefined, '')).toBe(true)
  })

  it('denies when the user has no grants', () => {
    expect(hasPermission(undefined, 'user:read')).toBe(false)
    expect(hasPermission(null, 'user:read')).toBe(false)
    expect(hasPermission([], 'user:read')).toBe(false)
  })

  it('matches an exact permission', () => {
    expect(hasPermission(['user:read'], 'user:read')).toBe(true)
    expect(hasPermission(['user:read'], 'user:delete')).toBe(false)
  })

  it('supports the global wildcard', () => {
    expect(hasPermission(['*'], 'role:update')).toBe(true)
  })

  it('supports resource wildcards', () => {
    expect(hasPermission(['user:*'], 'user:delete')).toBe(true)
    expect(hasPermission(['user:*'], 'role:read')).toBe(false)
  })

  it('does not treat a bare resource as a wildcard', () => {
    expect(hasPermission(['user'], 'user:read')).toBe(false)
  })
})

describe('filterNavGroups', () => {
  const groups: NavGroup[] = [
    {
      titleKey: 'first',
      items: [
        { titleKey: 'dashboard', to: '/', icon: LayoutDashboard, permission: 'dashboard:read' },
        { titleKey: 'users', to: '/users', icon: Users, permission: 'user:read' },
      ],
    },
    {
      titleKey: 'second',
      items: [{ titleKey: 'roles', to: '/roles', icon: ShieldCheck, permission: 'role:read' }],
    },
  ]

  it('keeps only permitted items and drops empty groups', () => {
    const filtered = filterNavGroups(groups, ['dashboard:read'])

    expect(filtered).toHaveLength(1)
    expect(internalNavItems(filtered[0].items).map((item) => item.to)).toEqual(['/'])
  })

  it('keeps an external entry for a session that grants it nothing', () => {
    // The docs link claims no permission, so the filter never removes it: hiding
    // it is the env seam's job, not the permission check's.
    const withDocs: NavGroup[] = [
      {
        titleKey: 'first',
        items: [
          ...groups[0].items,
          { titleKey: 'docs', href: 'https://docs.acme.test', icon: BookOpen, external: true },
        ],
      },
    ]

    const filtered = filterNavGroups(withDocs, ['dashboard:read'])
    expect(filtered[0].items.map((item) => item.titleKey)).toEqual(['dashboard', 'docs'])
  })

  it('keeps unrestricted items for any signed-in user', () => {
    const unrestricted: NavGroup[] = [
      {
        titleKey: 'account',
        items: [{ titleKey: 'profile', to: '/profile', icon: UserRound }],
      },
    ]

    expect(filterNavGroups(unrestricted, [])).toEqual(unrestricted)
  })

  it('returns every group for the admin wildcard', () => {
    expect(filterNavGroups(groups, ['*'])).toEqual(groups)
  })
})
