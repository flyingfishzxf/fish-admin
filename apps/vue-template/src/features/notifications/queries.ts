import { keepPreviousData, queryOptions } from '@tanstack/vue-query'

import {
  fetchNotification,
  fetchNotificationPreferences,
  fetchNotifications,
  type NotificationListParams,
} from './api'

export const notificationsQueryKey = ['notifications'] as const

export function notificationListQueryOptions(params: NotificationListParams) {
  return queryOptions({
    queryKey: ['notifications', 'list', params],
    queryFn: ({ signal }) => fetchNotifications(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function notificationSummaryQueryOptions() {
  return queryOptions({
    queryKey: ['notifications', 'summary'],
    queryFn: ({ signal }) => fetchNotifications({ page: 1, pageSize: 5, filter: 'all' }, signal),
    staleTime: 60_000,
  })
}

export function notificationDetailQueryOptions(id?: string) {
  return queryOptions({
    queryKey: ['notifications', 'detail', id],
    queryFn: ({ signal }) => fetchNotification(id as string, signal),
    enabled: Boolean(id),
  })
}

export function notificationPreferencesQueryOptions() {
  return queryOptions({
    queryKey: ['notifications', 'preferences'],
    queryFn: ({ signal }) => fetchNotificationPreferences(signal),
  })
}
