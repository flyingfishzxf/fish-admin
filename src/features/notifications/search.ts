import type { NotificationFilter } from '@/types'

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

export function validateNotificationsSearch(search: Record<string, unknown>): NotificationsSearch {
  const page = Number(search.page)
  const pageSize = Number(search.pageSize)
  const filter = FILTERS.includes(search.filter as NotificationFilter)
    ? (search.filter as NotificationFilter)
    : DEFAULT_NOTIFICATIONS_SEARCH.filter

  return {
    page: Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1,
    pageSize:
      Number.isFinite(pageSize) && pageSize >= 5 && pageSize <= 50 ? Math.floor(pageSize) : 10,
    filter,
    notification:
      typeof search.notification === 'string' && search.notification
        ? search.notification
        : undefined,
  }
}
