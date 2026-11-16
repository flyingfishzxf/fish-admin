import { ShieldCheck } from 'lucide-vue-next'
import { describe, expect, it } from 'vitest'

import { router } from '../router'
import { findNavGroup, findNavItem, IMPLEMENTED_PATHS, NAV_GROUPS, type NavGroup } from './nav'

describe('nav', () => {
  it('exposes exactly the fifteen implemented paths', () => {
    const paths = NAV_GROUPS.flatMap((group) => group.items.map((item) => item.to))
    expect(paths.sort()).toEqual([...IMPLEMENTED_PATHS].sort())
    expect(paths).toHaveLength(15)
  })

  it('ships the three account pages without a permission key', () => {
    const account = NAV_GROUPS.find((group) => group.titleKey === 'nav:groups.account')
    expect(account?.items.map((item) => item.to)).toEqual(['/profile', '/security', '/settings'])
    for (const item of account?.items ?? []) {
      expect(item.permission).toBeUndefined()
      expect(router.resolve(item.to).meta.permission).toBeUndefined()
    }
  })

  it('matches every nav permission with the route it opens', () => {
    for (const item of NAV_GROUPS.flatMap((group) => group.items)) {
      const resolved = router.resolve(item.to)
      expect(resolved.matched.length, `${item.to} has no route`).toBeGreaterThan(0)
      expect(resolved.meta.permission, `${item.to} permission`).toBe(item.permission)
    }
  })

  it('keeps only the built items of a partly shipped group', () => {
    // Workflows is still missing, so Collaboration holds the board, the library
    // and the inbox.
    const groups = NAV_GROUPS.filter((group) => group.titleKey === 'nav:groups.collaboration')
    expect(groups.map((group) => group.items.map((item) => item.to))).toEqual([
      ['/projects', '/files', '/notifications'],
    ])
  })

  it('ships the inbox without a permission key', () => {
    // Every signed-in role has notifications, so the entry and its route must
    // both stay keyless — a permission here would hide the bell's deep link.
    const collaboration = NAV_GROUPS.find((group) => group.titleKey === 'nav:groups.collaboration')
    const inbox = collaboration?.items.find((item) => item.to === '/notifications')
    expect(inbox?.permission).toBeUndefined()
    expect(router.resolve('/notifications').meta.permission).toBeUndefined()
  })

  it('finds the active item', () => {
    expect(findNavItem('/users')?.to).toBe('/users')
    expect(findNavItem('/')?.to).toBe('/')
  })

  it('matches the deepest path for a nested route', () => {
    // `/roles/matrix` ships but is not a nav entry, so it prefixes to Roles.
    expect(findNavItem('/roles/matrix')?.to).toBe('/roles')
    expect(findNavGroup('/roles/matrix')?.titleKey).toBe('nav:groups.management')

    const nested: NavGroup[] = [
      {
        titleKey: 'test',
        items: [
          { titleKey: 'roles', to: '/roles', icon: ShieldCheck },
          { titleKey: 'matrix', to: '/roles/matrix', icon: ShieldCheck },
        ],
      },
    ]
    expect(findNavItem('/roles/matrix', nested)?.to).toBe('/roles/matrix')
    expect(findNavItem('/roles/matrix/extra', nested)?.to).toBe('/roles/matrix')
  })

  it('returns nothing for a path the shell does not own', () => {
    expect(findNavItem('/workflows')).toBeUndefined()
  })
})
