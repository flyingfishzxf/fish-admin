import { describe, expect, it } from 'vitest'

import { ALL_NAV_ITEMS, NAV_GROUPS } from '@/config/nav'
import { MENU_ICON_NAMES } from '@/features/navigation/menu-icons'

import { buildMenuPayload } from './menu'

function pathsOf(payload: ReturnType<typeof buildMenuPayload>) {
  return payload.groups.flatMap((group) => group.items.map((item) => item.path))
}

describe('mock menu payload', () => {
  it('sends an icon name the client registry knows', () => {
    for (const item of buildMenuPayload().groups.flatMap((group) => group.items)) {
      expect(MENU_ICON_NAMES, item.path).toContain(item.icon)
    }
  })

  it('mirrors the shipped nav', () => {
    expect(pathsOf(buildMenuPayload())).toEqual(ALL_NAV_ITEMS.map((item) => item.to))
    expect(buildMenuPayload().groups.map((group) => group.titleKey)).toEqual(
      NAV_GROUPS.map((group) => group.titleKey),
    )
  })

  it('carries each entry permission so the client can re-check its session', () => {
    const items = buildMenuPayload().groups.flatMap((group) => group.items)

    expect(items.find((item) => item.path === '/users')?.permission).toBe('user:read')
    expect(items.find((item) => item.path === '/profile')?.permission).toBeUndefined()
  })

  it('leaves no group without an entry', () => {
    const payload = buildMenuPayload()
    expect(payload.groups.length).toBeGreaterThan(0)

    for (const group of payload.groups) {
      expect(group.items.length, group.titleKey).toBeGreaterThan(0)
    }
  })
})
