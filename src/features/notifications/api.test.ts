import { beforeEach, describe, expect, it, vi } from 'vitest'

const { apiRequestMock } = vi.hoisted(() => ({ apiRequestMock: vi.fn() }))

vi.mock('@/lib/api-client', () => ({ apiRequest: apiRequestMock }))

import {
  fetchNotification,
  fetchNotificationPreferences,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationsRead,
  updateNotification,
  updateNotificationPreferences,
} from './api'

const preferences = {
  quietStart: '22:00',
  quietEnd: '08:00',
  digest: 'daily' as const,
  channels: { inApp: true, email: true, push: false },
}

describe('notification API client', () => {
  beforeEach(() => {
    apiRequestMock.mockReset()
    apiRequestMock.mockResolvedValue(undefined)
  })

  it('serializes the notification list query', () => {
    fetchNotifications({ page: 2, pageSize: 20, filter: 'unread' })

    expect(apiRequestMock).toHaveBeenCalledWith('/notifications?page=2&pageSize=20&filter=unread')
  })

  it('omits the filter when it is not set', () => {
    fetchNotifications({ page: 1, pageSize: 5 })

    expect(apiRequestMock).toHaveBeenCalledWith('/notifications?page=1&pageSize=5')
  })

  it('reads and updates a single notification', () => {
    fetchNotification('notification/1')
    updateNotification('notification/1', true)

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, '/notifications/notification%2F1')
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, '/notifications/notification%2F1', {
      method: 'PATCH',
      body: { read: true },
    })
  })

  it('marks selected and all notifications as read', () => {
    markNotificationsRead(['notification-1', 'notification-2'])
    markAllNotificationsRead()

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, '/notifications/read', {
      method: 'POST',
      body: { ids: ['notification-1', 'notification-2'] },
    })
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, '/notifications/read-all', {
      method: 'POST',
    })
  })

  it('loads and saves preferences', () => {
    fetchNotificationPreferences()
    updateNotificationPreferences(preferences)

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, '/notifications/preferences')
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, '/notifications/preferences', {
      method: 'PUT',
      body: preferences,
    })
  })
})
