import { describe, expect, it } from 'vitest'

import { APP_PATHS, MENU_ICON_NAMES, NAV_CONTRACT } from './navigation'
import { ALL_PERMISSION_CODES } from './permissions'

const routes = NAV_CONTRACT.flatMap((group) => group.items)

describe('navigation contract', () => {
  it('declares every path once', () => {
    expect(new Set(routes.map((route) => route.to)).size).toBe(routes.length)
    expect(routes.map((route) => route.to).sort()).toEqual([...APP_PATHS].sort())
  })

  it('uses known icons and permissions', () => {
    for (const route of routes) {
      expect(MENU_ICON_NAMES, route.to).toContain(route.icon)
      if (route.permission) {
        expect(ALL_PERMISSION_CODES, route.to).toContain(route.permission)
      }
    }
  })

  it('leaves no group empty', () => {
    for (const group of NAV_CONTRACT) expect(group.items.length).toBeGreaterThan(0)
  })
})
