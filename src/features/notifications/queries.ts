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
    queryFn: ({ signal }) => fetchNotifications(params, signal),
    placeholderData: keepPreviousData,
  })

export function useNotificationListQuery(params: NotificationListParams) {
  return useQuery(notificationListQueryOptions(params))
}

export const notificationSummaryQueryOptions = () =>
  queryOptions({
    queryKey: ['notifications', 'summary'],
    queryFn: ({ signal }) => fetchNotifications({ page: 1, pageSize: 5, filter: 'all' }, signal),
    staleTime: 60_000,
  })

export function useNotificationSummaryQuery() {
  return useQuery(notificationSummaryQueryOptions())
}

export const notificationDetailQueryOptions = (id?: string) =>
  queryOptions({
    queryKey: ['notifications', 'detail', id],
    queryFn: ({ signal }) => fetchNotification(id as string, signal),
    enabled: Boolean(id),
  })

export function useNotificationDetailQuery(id?: string) {
  return useQuery(notificationDetailQueryOptions(id))
}

export const notificationPreferencesQueryOptions = () =>
  queryOptions({
    queryKey: ['notifications', 'preferences'],
    queryFn: ({ signal }) => fetchNotificationPreferences(signal),
  })

export function useNotificationPreferencesQuery() {
  return useQuery(notificationPreferencesQueryOptions())
}
