import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fetchQuery, sessionState } = vi.hoisted(() => ({
  fetchQuery: vi.fn(),
  sessionState: vi.fn(),
}))

vi.mock('@/lib/query-client', () => ({ queryClient: { fetchQuery } }))
vi.mock('@/stores/auth-store', () => ({ useAuthStore: { getState: sessionState } }))

import { PERMISSION_CODES } from '@/config/permissions'
import type { MenuPayload } from '@/features/navigation/api'

import { MENU_ACCESS_BUDGET_MS, enforceMenuAccess } from './menu-access'

const ADMIN = { user: { permissions: ['*'] }, status: 'authenticated' }
const NO_USER = { user: null, status: 'authenticated' }

// Only the dashboard survives here, so every other managed path is a redirect.
const MENU: MenuPayload = {
  groups: [
    {
      titleKey: 'nav:groups.overview',
      items: [{ titleKey: 'nav:items.dashboard', path: '/', icon: 'layout-dashboard' }],
    },
  ],
}

/** `redirect()` returns the throw value rather than throwing, so this mirrors the guard. */
async function redirectTo(pathname: string) {
  try {
    await enforceMenuAccess({ location: { pathname } })
    return undefined
  } catch (error) {
    return (error as { options?: { to?: string } }).options?.to
  }
}

describe('enforceMenuAccess', () => {
  beforeEach(() => {
    fetchQuery.mockReset()
    sessionState.mockReturnValue(ADMIN)
  })

  it('never fetches for a page the menu does not own', async () => {
    for (const pathname of ['/403', '/login', '/nope-at-all']) {
      await expect(redirectTo(pathname)).resolves.toBeUndefined()
    }

    expect(fetchQuery).not.toHaveBeenCalled()
  })

  it('lets a path the server menu carries through', async () => {
    fetchQuery.mockResolvedValue(MENU)

    await expect(redirectTo('/')).resolves.toBeUndefined()
    expect(fetchQuery).toHaveBeenCalledTimes(1)
  })

  it('403s a page the server hid although the session permits it', async () => {
    fetchQuery.mockResolvedValue(MENU)

    // `/notifications` has no permission in the shipped nav, so the client's own
    // codes could never hide it: only the menu can.
    await expect(redirectTo('/notifications')).resolves.toBe('/403')
  })

  it('treats a detail route as its parent menu entry', async () => {
    fetchQuery.mockResolvedValue(MENU)

    await expect(redirectTo('/users/42')).resolves.toBe('/403')
  })

  it('uses the shipped nav when the menu request fails', async () => {
    fetchQuery.mockRejectedValue(new Error('no /menu endpoint on this backend'))

    await expect(redirectTo('/')).resolves.toBeUndefined()
    await expect(redirectTo('/users')).resolves.toBeUndefined()
    await expect(redirectTo('/notifications')).resolves.toBeUndefined()
  })

  it('applies the session to the shipped nav after a failed fetch', async () => {
    fetchQuery.mockRejectedValue(new Error('offline'))
    sessionState.mockReturnValue({ user: { permissions: [PERMISSION_CODES.dashboardRead] } })

    await expect(redirectTo('/')).resolves.toBeUndefined()
    await expect(redirectTo('/users')).resolves.toBe('/403')
  })

  it('re-checks a server item against the session when the two disagree', async () => {
    fetchQuery.mockResolvedValue({
      groups: [
        {
          titleKey: 'nav:groups.management',
          items: [
            {
              titleKey: 'nav:items.users',
              path: '/users',
              icon: 'users',
              permission: PERMISSION_CODES.userRead,
            },
          ],
        },
      ],
    })
    sessionState.mockReturnValue(NO_USER)

    await expect(redirectTo('/users')).resolves.toBe('/403')
  })

  it('bounds the wait so a slow API cannot stall navigation', () => {
    expect(MENU_ACCESS_BUDGET_MS).toBeLessThan(5_000)
  })
})
