import { createRouter } from '@tanstack/react-router'
import { describe, expect, it } from 'vitest'

import {
  ALL_NAV_ITEMS,
  NAV_GROUPS,
  findNavGroup,
  findNavItem,
  isPathActive,
  type AppPath,
} from '@/config/nav'
import enNav from '@/locales/en/nav.json'
import zhNav from '@/locales/zh-CN/nav.json'
import { routeTree } from '@/routeTree.gen'

const router = createRouter({ routeTree })

const EXPECTED_ROUTE_IDS: Record<AppPath, string> = {
  '/': '/_app/',
  '/ui': '/_app/ui',
  '/components': '/_app/components',
  '/projects': '/_app/projects',
  '/reports': '/_app/reports',
  '/files': '/_app/files',
  '/notifications': '/_app/notifications',
  '/users': '/_app/users',
  '/departments': '/_app/departments',
  '/roles': '/_app/roles',
  '/permissions': '/_app/permissions',
  '/audit-logs': '/_app/audit-logs',
  '/integrations': '/_app/integrations',
  '/profile': '/_app/profile',
  '/security': '/_app/security',
  '/settings': '/_app/settings',
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
      expect(routeIds).toContain(EXPECTED_ROUTE_IDS[to])
      expect(routeIds).not.toContain('/_app/$')
    },
  )

  it.each(
    ALL_NAV_ITEMS.flatMap((item) => [
      [item.titleKey, enNav] as const,
      [item.titleKey, zhNav] as const,
    ]),
  )('has a translated label for %s', (titleKey, resource) => {
    expect(typeof lookup(resource as Record<string, unknown>, titleKey.replace(/^nav:/, ''))).toBe(
      'string',
    )
  })

  it('has a translated group label for every group', () => {
    for (const group of NAV_GROUPS) {
      for (const resource of [enNav, zhNav]) {
        expect(
          typeof lookup(resource as Record<string, unknown>, group.titleKey.replace(/^nav:/, '')),
        ).toBe('string')
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
})
