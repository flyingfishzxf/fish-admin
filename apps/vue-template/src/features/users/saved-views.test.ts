import { beforeEach, describe, expect, it } from 'vitest'

import type { SavedView } from './saved-views'
import { createView, loadViews, MAX_NAME, MAX_VIEWS, persistViews, storageKey } from './saved-views'
import { DEFAULT_USERS_SEARCH } from './search'

const userId = 'admin'

function view(id: string, name: string): SavedView {
  return {
    id,
    name,
    search: { sort: 'createdAt', order: 'desc', pageSize: 10 },
    createdAt: '2026-01-01T00:00:00.000Z',
  }
}

describe('saved views storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns nothing when the user has never saved a view', () => {
    expect(loadViews(userId)).toEqual([])
  })

  it('round-trips through storage in the order written', () => {
    persistViews(userId, [view('b', 'Admins'), view('a', 'Inactive')])
    expect(loadViews(userId).map((entry) => entry.name)).toEqual(['Admins', 'Inactive'])
  })

  it('treats corrupt json as no views instead of throwing', () => {
    localStorage.setItem(storageKey(userId), '{not json')
    expect(loadViews(userId)).toEqual([])
  })

  it('drops entries that are not shaped like a view', () => {
    localStorage.setItem(
      storageKey(userId),
      JSON.stringify([view('a', 'Keep'), { id: 'b' }, null, 'nope']),
    )
    expect(loadViews(userId).map((entry) => entry.id)).toEqual(['a'])
  })

  it('keys each account separately', () => {
    persistViews('admin', [view('a', 'Mine')])
    expect(loadViews('viewer')).toEqual([])
    expect(storageKey('viewer')).toBe('fish-admin:users-views:viewer')
  })

  it('copies only the search fields a view restores', () => {
    const created = createView('  Inactive admins  ', {
      ...DEFAULT_USERS_SEARCH,
      page: 4,
      q: 'ada',
      roleId: 'r1',
      status: 'inactive',
      sort: 'name',
      order: 'asc',
      pageSize: 50,
    })

    expect(created.name).toBe('Inactive admins')
    expect(created.id).toMatch(/[0-9a-f-]{16}/)
    // The page is deliberately not part of a view: applying one starts over.
    expect(created.search).toEqual({
      q: 'ada',
      roleId: 'r1',
      status: 'inactive',
      sort: 'name',
      order: 'asc',
      pageSize: 50,
    })
  })

  it('truncates a long name rather than rejecting it', () => {
    expect(createView('x'.repeat(MAX_NAME + 20), DEFAULT_USERS_SEARCH).name).toHaveLength(MAX_NAME)
    expect(MAX_VIEWS).toBe(10)
  })
})
