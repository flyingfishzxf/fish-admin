import type { NotificationFilter } from '@fish-admin/contracts'

export interface NotificationsSearch {
  page: number
  pageSize: number
  filter: NotificationFilter
  notification?: string
}

const FILTERS: NotificationFilter[] = ['all', 'unread', 'mention']

export const DEFAULT_NOTIFICATIONS_SEARCH: NotificationsSearch = {
  page: 1,
  pageSize: 10,
  filter: 'all',
}

type QueryValue = string | string[] | null | undefined

function first(value: QueryValue): string | undefined {
  const candidate = Array.isArray(value) ? value[0] : value
  return typeof candidate === 'string' && candidate !== '' ? candidate : undefined
}

/** Same bounds the mock enforces, so a hand-edited URL cannot ask for page 0 or 500 rows. */
export function parseNotificationsSearch(
  query: Record<string, QueryValue> = {},
): NotificationsSearch {
  const rawPage = Number(first(query.page))
  const rawPageSize = Number(first(query.pageSize))
  const rawFilter = first(query.filter)

  return {
    page: Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1,
    pageSize:
      Number.isFinite(rawPageSize) && rawPageSize >= 5 && rawPageSize <= 50
        ? Math.floor(rawPageSize)
        : DEFAULT_NOTIFICATIONS_SEARCH.pageSize,
    filter: FILTERS.includes(rawFilter as NotificationFilter)
      ? (rawFilter as NotificationFilter)
      : DEFAULT_NOTIFICATIONS_SEARCH.filter,
    notification: first(query.notification),
  }
}

/** Serialises a search back to router query values; defaults stay out of the URL. */
export function toNotificationsQuery(search: Partial<NotificationsSearch>): Record<string, string> {
  const query: Record<string, string> = {}
  if (search.page && search.page !== DEFAULT_NOTIFICATIONS_SEARCH.page)
    query.page = String(search.page)
  if (search.pageSize && search.pageSize !== DEFAULT_NOTIFICATIONS_SEARCH.pageSize)
    query.pageSize = String(search.pageSize)
  if (search.filter && search.filter !== DEFAULT_NOTIFICATIONS_SEARCH.filter)
    query.filter = search.filter
  if (search.notification) query.notification = search.notification
  return query
}
