import { createRouter } from '@tanstack/react-router'
import { describe, expect, it } from 'vitest'

import {
  ALL_NAV_ITEMS,
  NAV_GROUPS,
  findNavGroup,
  findNavItem,
  flattenNavItems,
  isAppPath,
  isManagedNavPath,
  isPathActive,
  type NavGroup,
  type NavItem,
} from '@/config/nav'
import { routeTree } from '@/routeTree.gen'

const router = createRouter({ routeTree })

// Discovered rather than listed so a scaffolded copy that keeps only one locale
// still fails if a label goes missing, and does not fail because a locale the
// adopter removed is not imported here.
const navResources = Object.entries(
  import.meta.glob('../locales/*/nav.json', { eager: true, import: 'default' }) as Record<
    string,
    Record<string, unknown>
  >,
)

function expectedRouteId(path: string) {
  return path === '/' ? '/_app/' : `/_app${path}`
}

function lookup(source: Record<string, unknown>, key: string): unknown {
  return key.split('.').reduce<unknown>((value, segment) => {
    if (value && typeof value === 'object' && segment in value) {
      return (value as Record<string, unknown>)[segment]
    }
    return undefined
  }, source)
}

describe('navigation config', () => {
  it('declares unique paths', () => {
    const paths = ALL_NAV_ITEMS.map((item) => item.to)
    expect(new Set(paths).size).toBe(paths.length)
  })

  it.each(ALL_NAV_ITEMS.map((item) => [item.to, item.titleKey] as const))(
    'resolves %s to a real route',
    (to) => {
      const matches = router.matchRoutes(to)
      const routeIds = matches.map((match) => match.routeId)

      expect(routeIds).toContain('/_app')
      expect(routeIds).toContain(expectedRouteId(to))
      expect(routeIds).not.toContain('/_app/$')
    },
  )

  it('ships the nav bundle in every locale', () => {
    expect(navResources.length).toBeGreaterThan(0)
  })

  it.each(
    ALL_NAV_ITEMS.flatMap((item) =>
      navResources.map(([, resource]) => [item.titleKey, resource] as const),
    ),
  )('has a translated label for %s', (titleKey, resource) => {
    expect(typeof lookup(resource, titleKey.replace(/^nav:/, ''))).toBe('string')
  })

  it('has a translated group label for every group', () => {
    for (const group of NAV_GROUPS) {
      for (const [, resource] of navResources) {
        expect(typeof lookup(resource, group.titleKey.replace(/^nav:/, ''))).toBe('string')
      }
    }
  })

  it('matches active paths without over-matching the root', () => {
    expect(isPathActive('/', '/')).toBe(true)
    expect(isPathActive('/users', '/')).toBe(false)
    expect(isPathActive('/users', '/users')).toBe(true)
    expect(isPathActive('/users/42', '/users')).toBe(true)
    expect(isPathActive('/users-archive', '/users')).toBe(false)
  })

  it('looks up the active group and item', () => {
    expect(findNavItem('/roles')?.titleKey).toBe('nav:items.roles')
    expect(findNavGroup('/roles/editor')?.titleKey).toBe('nav:groups.management')
    expect(findNavItem('/unknown')).toBeUndefined()
    expect(findNavGroup('/unknown')).toBeUndefined()
  })

  it('resolves the longest matching nav item', () => {
    expect(findNavItem('/roles/matrix')?.to).toBe('/roles')
    expect(findNavItem('/departments')?.to).toBe('/departments')
    expect(findNavItem('/users/42')?.to).toBe('/users')
    expect(findNavItem('/')?.to).toBe('/')
  })

  it('resolves against a menu the server sent rather than the shipped nav', () => {
    const dashboardOnly = [{ titleKey: 'nav:groups.overview', items: [ALL_NAV_ITEMS[0]] }]

    expect(findNavItem('/users', dashboardOnly)).toBeUndefined()
    expect(findNavGroup('/users', dashboardOnly)).toBeUndefined()
    expect(findNavItem('/', dashboardOnly)?.titleKey).toBe('nav:items.dashboard')
    expect(findNavGroup('/', dashboardOnly)?.titleKey).toBe('nav:groups.overview')
  })

  it('matches a child item before its parent', () => {
    const reports: NavItem = { ...ALL_NAV_ITEMS[0], titleKey: 'nav:items.reports', to: '/reports' }
    const withChildren: NavGroup[] = [
      {
        titleKey: 'nav:groups.overview',
        items: [{ ...ALL_NAV_ITEMS[0], children: [reports] }],
      },
    ]

    expect(findNavItem('/reports', withChildren)?.titleKey).toBe('nav:items.reports')
    expect(findNavItem('/nope', withChildren)).toBeUndefined()
    expect(flattenNavItems(withChildren).map((item) => item.to)).toEqual(['/', '/reports'])
  })

  it.each(ALL_NAV_ITEMS.map((item) => [item.to] as const))(
    'treats %s as a page the menu owns',
    (path) => {
      expect(isManagedNavPath(path)).toBe(true)
    },
  )

  it('owns a detail route through its parent entry, but not the root', () => {
    expect(isManagedNavPath('/users/42')).toBe(true)
    expect(isManagedNavPath('/nope-at-all')).toBe(false)
    // `/` only matches itself, so an unknown path is not a hidden menu page.
    expect(isManagedNavPath('/somewhere-new')).toBe(false)
  })

  it('does not own the screens outside the menu', () => {
    for (const pathname of ['/403', '/401', '/login', '/register', '/nope']) {
      expect(isManagedNavPath(pathname)).toBe(false)
    }
  })

  it('accepts only paths this build has routes for', () => {
    expect(isAppPath('/users')).toBe(true)
    expect(isAppPath('/roles/matrix')).toBe(false)
    expect(isAppPath('/components-but-not-really')).toBe(false)
    expect(isAppPath(undefined)).toBe(false)
    expect(isAppPath(42)).toBe(false)
  })
})
