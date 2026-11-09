import { NAV_CONTRACT, MENU_ICON_NAMES } from '@fish-admin/contracts/navigation'
import { describe, expect, it } from 'vitest'

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

  it('mirrors the shared navigation contract', () => {
    expect(pathsOf(buildMenuPayload())).toEqual(
      NAV_CONTRACT.flatMap((group) => group.items.map((item) => item.to)),
    )
    expect(buildMenuPayload().groups.map((group) => group.titleKey)).toEqual(
      NAV_CONTRACT.map((group) => group.titleKey),
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
