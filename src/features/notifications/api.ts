import { apiRequest } from '@/lib/api-client'
import type {
  NotificationFilter,
  NotificationPreferences,
  PaginatedResult,
  WorkspaceNotification,
} from '@/types'

export interface NotificationListParams {
  page: number
  pageSize: number
  filter?: NotificationFilter
}

export interface NotificationListResult extends PaginatedResult<WorkspaceNotification> {
  unreadCount: number
}

export function fetchNotifications(params: NotificationListParams) {
  const search = new URLSearchParams()
  search.set('page', String(params.page))
  search.set('pageSize', String(params.pageSize))
  if (params.filter) search.set('filter', params.filter)

  return apiRequest<NotificationListResult>(`/notifications?${search.toString()}`)
}

export function fetchNotification(id: string) {
  return apiRequest<WorkspaceNotification>(`/notifications/${encodeURIComponent(id)}`)
}

export function updateNotification(id: string, read: boolean) {
  return apiRequest<WorkspaceNotification>(`/notifications/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: { read },
  })
}

export function markNotificationsRead(ids: string[]) {
  return apiRequest<{ updated: number }>('/notifications/read', {
    method: 'POST',
    body: { ids },
  })
}

export function markAllNotificationsRead() {
  return apiRequest<{ updated: number }>('/notifications/read-all', { method: 'POST' })
}

export function fetchNotificationPreferences() {
  return apiRequest<NotificationPreferences>('/notifications/preferences')
}

export function updateNotificationPreferences(input: NotificationPreferences) {
  return apiRequest<NotificationPreferences>('/notifications/preferences', {
    method: 'PUT',
    body: input,
  })
}
