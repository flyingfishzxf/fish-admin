import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { NotificationCenter, type NotificationItem } from '@fish-admin/react'
import { formatRelativeTime } from '@/lib/format'

import { markAllNotificationsRead, updateNotification } from '@/features/notifications/api'
import {
  notificationIcon,
  notificationSummary,
  notificationTitle,
} from '@/features/notifications/notification-meta'
import { useNotificationSummaryQuery } from '@/features/notifications/queries'

export function NotificationBell() {
  const { t, i18n } = useTranslation('notifications')
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const summary = useNotificationSummaryQuery()

  const readMutation = useMutation({
    mutationFn: (id: string) => updateNotification(id, true),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const items: NotificationItem[] = (summary.data?.items ?? []).map((notification) => ({
    id: notification.id,
    title: notificationTitle(t, notification),
    description: notificationSummary(t, notification),
    time: formatRelativeTime(notification.createdAt, i18n.language),
    read: notification.read,
    icon: notificationIcon(notification.kind),
  }))

  function openNotification(item: NotificationItem) {
    readMutation.mutate(item.id)
    void navigate({
      to: '/notifications',
      search: { page: 1, pageSize: 10, filter: 'all', notification: item.id },
    })
  }

  return (
    <span data-tour="notifications">
      <NotificationCenter
        ariaLabel={t('bell.label')}
        title={t('bell.title')}
        markAllLabel={t('actions.markAllRead')}
        emptyLabel={t('empty.title')}
        viewAllLabel={t('actions.viewAll')}
        items={items}
        unreadCount={summary.data?.unreadCount}
        onItemClick={openNotification}
        onMarkAllRead={() => markAllMutation.mutate()}
        onViewAll={() =>
          void navigate({ to: '/notifications', search: { page: 1, pageSize: 10, filter: 'all' } })
        }
      />
    </span>
  )
}
