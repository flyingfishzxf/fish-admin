import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'

import {
  fetchNotification,
  fetchNotificationPreferences,
  fetchNotifications,
  type NotificationListParams,
} from './api'

export const notificationListQueryOptions = (params: NotificationListParams) =>
  queryOptions({
    queryKey: ['notifications', params],
    queryFn: () => fetchNotifications(params),
    placeholderData: keepPreviousData,
  })

export function useNotificationListQuery(params: NotificationListParams) {
  return useQuery(notificationListQueryOptions(params))
}

export const notificationSummaryQueryOptions = () =>
  queryOptions({
    queryKey: ['notifications', 'summary'],
    queryFn: () => fetchNotifications({ page: 1, pageSize: 5, filter: 'all' }),
    staleTime: 60_000,
  })

export function useNotificationSummaryQuery() {
  return useQuery(notificationSummaryQueryOptions())
}

export const notificationDetailQueryOptions = (id?: string) =>
  queryOptions({
    queryKey: ['notifications', 'detail', id],
    queryFn: () => fetchNotification(id as string),
    enabled: Boolean(id),
  })

export function useNotificationDetailQuery(id?: string) {
  return useQuery(notificationDetailQueryOptions(id))
}

export const notificationPreferencesQueryOptions = () =>
  queryOptions({
    queryKey: ['notifications', 'preferences'],
    queryFn: fetchNotificationPreferences,
  })

export function useNotificationPreferencesQuery() {
  return useQuery(notificationPreferencesQueryOptions())
}
