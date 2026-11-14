import type { UsersSearch } from './search'

export interface SavedView {
  id: string
  name: string
  search: Pick<UsersSearch, 'q' | 'roleId' | 'status' | 'sort' | 'order' | 'pageSize'>
  createdAt: string
}

/** Ten is enough for the filter combinations anyone actually reuses. */
export const MAX_VIEWS = 10
/** Names are truncated rather than rejected, so a paste of a sentence still saves. */
export const MAX_NAME = 40

export function storageKey(userId: string) {
  return `fish-admin:users-views:${userId}`
}

/**
 * Anything that is not an array of the right shape is treated as "no views".
 * A hand-edited or half-written storage entry must not break the page.
 */
export function loadViews(userId: string): SavedView[] {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (view): view is SavedView =>
        typeof view === 'object' &&
        view !== null &&
        typeof (view as SavedView).id === 'string' &&
        typeof (view as SavedView).name === 'string' &&
        typeof (view as SavedView).search === 'object',
    )
  } catch {
    return []
  }
}

export function persistViews(userId: string, views: SavedView[]) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(views))
  } catch {
    // Storage can be blocked; the views still work for this session.
  }
}

export function createView(name: string, search: UsersSearch): SavedView {
  return {
    id: crypto.randomUUID(),
    name: name.trim().slice(0, MAX_NAME),
    search: {
      q: search.q,
      roleId: search.roleId,
      status: search.status,
      sort: search.sort,
      order: search.order,
      pageSize: search.pageSize,
    },
    createdAt: new Date().toISOString(),
  }
}
