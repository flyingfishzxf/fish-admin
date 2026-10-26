import { describe, expect, it } from 'vitest'

import { ALL_NAV_ITEMS, NAV_GROUPS } from '@/config/nav'
import { DEMO_ROLE_PERMISSIONS } from '@/config/permissions'
import { MENU_ICON_NAMES } from '@/features/navigation/menu-icons'

import { buildMenuPayload } from './menu'

const WILDCARD = DEMO_ROLE_PERMISSIONS.admin
const MANAGER = DEMO_ROLE_PERMISSIONS.manager
const VIEWER = DEMO_ROLE_PERMISSIONS.viewer

function pathsOf(payload: ReturnType<typeof buildMenuPayload>) {
  return payload.groups.flatMap((group) => group.items.map((item) => item.path))
}

describe('mock menu payload', () => {
  it('sends an icon name the client registry knows', () => {
    for (const item of buildMenuPayload(WILDCARD).groups.flatMap((group) => group.items)) {
      expect(MENU_ICON_NAMES, item.path).toContain(item.icon)
    }
  })

  it('mirrors the shipped nav for the full-access role', () => {
    expect(pathsOf(buildMenuPayload(WILDCARD))).toEqual(ALL_NAV_ITEMS.map((item) => item.to))
    expect(buildMenuPayload(WILDCARD).groups.map((group) => group.titleKey)).toEqual(
      NAV_GROUPS.map((group) => group.titleKey),
    )
  })

  it('keeps the design-system pages on the full-access role only', () => {
    expect(pathsOf(buildMenuPayload(WILDCARD))).toContain('/ui')
    expect(pathsOf(buildMenuPayload(MANAGER))).not.toContain('/ui')
    expect(pathsOf(buildMenuPayload(VIEWER))).not.toContain('/components')
  })

  it('carries each entry permission so the client can re-check its session', () => {
    const items = buildMenuPayload(VIEWER).groups.flatMap((group) => group.items)

    expect(items.find((item) => item.path === '/users')?.permission).toBe('user:read')
    expect(items.find((item) => item.path === '/profile')?.permission).toBeUndefined()
  })

  it('leaves no empty group behind', () => {
    for (const payload of [buildMenuPayload(WILDCARD), buildMenuPayload([])]) {
      expect(payload.groups.length).toBeGreaterThan(0)

      for (const group of payload.groups) {
        expect(group.items.length, group.titleKey).toBeGreaterThan(0)
      }
    }
  })
})
