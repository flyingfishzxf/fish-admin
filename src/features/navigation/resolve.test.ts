import { CircleDot, LayoutDashboard, Users } from 'lucide-react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  NAV_GROUPS,
  internalNavItems,
  isExternalNavItem,
  type NavGroup,
  type NavItem,
} from '@/config/nav'
import { PERMISSION_CODES } from '@/config/permissions'

import { MENU_ICON_NAMES, iconNameFor, resolveMenuIcon } from './menu-icons'
import type { MenuPayload, MenuRoutePayload } from './api'
import { resolveMenuGroups } from './resolve'

const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items)

// The resolver may append the external docs entry, which has no path; the path
// assertions below only ever care about the internal items.
function pathsOf(items: NavItem[]) {
  return internalNavItems(items).map((item) => item.to)
}

function childrenOf(item: NavItem) {
  return isExternalNavItem(item) ? undefined : item.children
}

function payload(
  items: Array<Record<string, unknown>>,
  titleKey = 'nav:groups.overview',
): MenuPayload {
  return { groups: [{ titleKey, items: items as unknown as MenuRoutePayload[] }] }
}

describe('menu icon registry', () => {
  it('names every icon the shipped nav uses', () => {
    // The mock backend serializes NAV_GROUPS through this registry, so an icon
    // without a name would quietly arrive as the fallback marker.
    for (const item of ALL_NAV_ITEMS) {
      expect(iconNameFor(item.icon), item.titleKey).toBeTypeOf('string')
    }
  })

  it('resolves a known name and degrades on an unknown one', () => {
    expect(resolveMenuIcon('users')).toBe(Users)
    expect(resolveMenuIcon('no-such-icon')).toBe(CircleDot)
    expect(resolveMenuIcon(undefined)).toBe(CircleDot)
    expect(resolveMenuIcon(42)).toBe(CircleDot)
  })

  it('exposes sorted names for the API docs', () => {
    expect(MENU_ICON_NAMES).toEqual([...MENU_ICON_NAMES].sort())
    expect(MENU_ICON_NAMES).toContain('layout-dashboard')
    expect(resolveMenuIcon(MENU_ICON_NAMES[0])).not.toBe(CircleDot)
  })
})

describe('resolveMenuGroups', () => {
  it('falls back to the nav this build ships when there is no payload', () => {
    expect(resolveMenuGroups(undefined, ['*'])).toEqual(NAV_GROUPS)
  })

  it('filters the fallback by the session, exactly as the offline nav did', () => {
    const granted = [PERMISSION_CODES.dashboardRead]
    const paths = resolveMenuGroups(null, granted).flatMap((group) => pathsOf(group.items))

    expect(paths).toContain('/')
    expect(paths).not.toContain('/users')
    expect(paths).not.toContain('/reports')
    // Nothing in the nav claims a permission, so the menu keeps them anyway.
    expect(paths).toContain('/notifications')
  })

  it('maps a server payload, including its icons', () => {
    const groups = resolveMenuGroups(
      payload([
        { titleKey: 'nav:items.dashboard', path: '/', icon: 'layout-dashboard' },
        { titleKey: 'nav:items.users', path: '/users', icon: 'users', permission: 'user:read' },
      ]),
      ['*'],
    )

    expect(groups).toHaveLength(1)
    expect(groups[0].titleKey).toBe('nav:groups.overview')
    expect(groups[0].items[1]).toMatchObject({
      to: '/users',
      icon: Users,
      permission: 'user:read',
    })
    expect(groups[0].items[0].icon).toBe(LayoutDashboard)
  })

  it('keeps a server entry the session cannot see out of the menu', () => {
    const groups = resolveMenuGroups(
      payload([
        { titleKey: 'nav:items.dashboard', path: '/', icon: 'layout-dashboard' },
        { titleKey: 'nav:items.users', path: '/users', icon: 'users', permission: 'user:read' },
      ]),
      [],
    )

    expect(pathsOf(groups[0].items)).toEqual(['/'])
  })

  it('degrades an unknown icon instead of throwing', () => {
    const groups = resolveMenuGroups(
      payload([{ titleKey: 'nav:items.reports', path: '/reports', icon: 'sparkle' }]),
      ['*'],
    )

    expect(groups[0].items[0].icon).toBe(CircleDot)
  })

  it('drops paths this build does not have and entries without a label', () => {
    const groups = resolveMenuGroups(
      payload([
        { titleKey: 'nav:items.dashboard', path: '/dashboard-that-is-not-a-route' },
        { titleKey: 'nav:items.users', path: '/users' },
        { path: '/roles', icon: 'shield-check' },
      ]),
      ['*'],
    )

    expect(pathsOf(groups[0].items)).toEqual(['/users'])
    // No icon on the surviving entry: the marker stands in rather than a crash.
    expect(groups[0].items[0].icon).toBe(CircleDot)
  })

  it('keeps children and drops an empty parent subtree', () => {
    const groups = resolveMenuGroups(
      payload([
        {
          titleKey: 'nav:items.users',
          path: '/users',
          icon: 'users',
          children: [
            { titleKey: 'nav:items.profile', path: '/profile', icon: 'user-round' },
            { titleKey: 'nav:items.reports', path: '/nowhere', icon: 'bar-chart-3' },
          ],
        },
        {
          titleKey: 'nav:items.roles',
          path: '/roles',
          icon: 'shield-check',
          children: [{ titleKey: 'nav:items.permissions', path: '/nope' }],
        },
      ]),
      ['*'],
    )

    expect(pathsOf(groups[0].items)).toEqual(['/users', '/roles'])
    expect(childrenOf(groups[0].items[0])?.map((child) => child.to)).toEqual(['/profile'])
    // A parent whose only child was unrenderable keeps its own link, not an empty subtree.
    expect(childrenOf(groups[0].items[1])).toBeUndefined()
  })

  it('falls back when the payload is not shaped like a menu', () => {
    const granted = ['*']
    const broken = [
      {},
      { groups: [] },
      { groups: 'nope' },
      { groups: [{ titleKey: 'nav:groups.overview' }] },
      { groups: [{ titleKey: 'nav:groups.overview', items: 'nope' }] },
      { groups: [{ titleKey: 'nav:groups.overview', items: [{ path: '/' }] }] },
    ] as unknown as MenuPayload[]

    for (const payload of broken) {
      expect(resolveMenuGroups(payload, granted).flatMap((group) => group.items).length).toBe(
        ALL_NAV_ITEMS.length,
      )
    }
  })

  it('drops a group whose entries are all unrenderable', () => {
    const groups = resolveMenuGroups(
      {
        groups: [
          {
            titleKey: 'nav:groups.management',
            items: [{ titleKey: 'x', path: '/ghost', icon: 'shield-check' }],
          },
          {
            titleKey: 'nav:groups.overview',
            items: [{ titleKey: 'nav:items.dashboard', path: '/', icon: 'layout-dashboard' }],
          },
        ],
      },
      ['*'],
    )

    expect(groups.map((group) => group.titleKey)).toEqual(['nav:groups.overview'])
  })
})

function externalItems(groups: NavGroup[]) {
  return groups.flatMap((group) => group.items.filter((item) => isExternalNavItem(item)))
}

describe('docs entry', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('appears for every role, in both the served and the offline menu', async () => {
    vi.stubEnv('VITE_DOCS_URL', 'https://docs.acme.test')
    vi.resetModules()
    const { resolveMenuGroups: resolve } = await import('./resolve')

    for (const granted of [['*'], ['project:read'], []]) {
      const served = resolve(
        payload([{ titleKey: 'nav:items.dashboard', path: '/', icon: 'layout-dashboard' }]),
        granted,
      )
      const offline = resolve(null, granted)
      expect(externalItems(served)).toHaveLength(1)
      expect(externalItems(offline)).toHaveLength(1)
    }
  })

  it('is absent when the docs URL is unset', async () => {
    vi.stubEnv('VITE_DOCS_URL', '')
    vi.resetModules()
    const { resolveMenuGroups: resolve } = await import('./resolve')
    expect(externalItems(resolve(null, ['*']))).toHaveLength(0)
  })
})
