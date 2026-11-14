import { keepPreviousData, queryOptions } from '@tanstack/vue-query'
import { computed, unref, type MaybeRef } from 'vue'

import {
  fetchNotification,
  fetchNotificationPreferences,
  fetchNotifications,
  type NotificationListParams,
} from './api'

export const notificationsQueryKey = ['notifications'] as const

export const notificationKeys = {
  all: notificationsQueryKey,
  list: (params: NotificationListParams) => ['notifications', 'list', params] as const,
  summary: ['notifications', 'summary'] as const,
  detail: (id: string | undefined) => ['notifications', 'detail', id] as const,
  preferences: ['notifications', 'preferences'] as const,
}

// The page reads its paging straight off the URL, so every parameter arrives as
// a ref. `queryKey` has to be a computed for the same reason: a plain array
// would snapshot the first render and no filter or page change would refetch.
export function notificationListQueryOptions(params: MaybeRef<NotificationListParams>) {
  return queryOptions({
    queryKey: computed(() => notificationKeys.list(unref(params))),
    queryFn: ({ signal }) => fetchNotifications(unref(params), signal),
    placeholderData: keepPreviousData,
  })
}

export function notificationSummaryQueryOptions() {
  return queryOptions({
    queryKey: notificationKeys.summary,
    queryFn: ({ signal }) => fetchNotifications({ page: 1, pageSize: 5, filter: 'all' }, signal),
    staleTime: 60_000,
  })
}

export function notificationDetailQueryOptions(id: MaybeRef<string | undefined>) {
  return queryOptions({
    queryKey: computed(() => notificationKeys.detail(unref(id))),
    queryFn: ({ signal }) => fetchNotification(unref(id) as string, signal),
    // A function rather than a ref of a boolean: `enabled` is evaluated on every
    // render, and the drawer must not fire a request for an id that is absent.
    enabled: () => Boolean(unref(id)),
  })
}

export function notificationPreferencesQueryOptions() {
  return queryOptions({
    queryKey: notificationKeys.preferences,
    queryFn: ({ signal }) => fetchNotificationPreferences(signal),
  })
}
