import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { DEFAULT_FILES_SEARCH } from '@/features/files/search'
import { DEFAULT_INTEGRATIONS_SEARCH } from '@/features/integrations/search'
import { formatDateTime } from '@/lib/format'
import type { WorkspaceNotification } from '@/types'

import {
  notificationBody,
  notificationIcon,
  notificationSummary,
  notificationTitle,
} from '../notification-meta'

function EntityLink({ notification }: { notification: WorkspaceNotification }) {
  if (!notification.entityId || !notification.entityLabel) {
    return <span>—</span>
  }

  const label = notification.entityLabel
  switch (notification.entityType) {
    case 'project':
      return (
        <Link
          to="/projects/$id"
          params={{ id: notification.entityId }}
          className="font-medium text-primary hover:underline"
        >
          {label}
        </Link>
      )
    case 'user':
      return (
        <Link
          to="/users/$id"
          params={{ id: notification.entityId }}
          className="font-medium text-primary hover:underline"
        >
          {label}
        </Link>
      )
    case 'file':
      return (
        <Link
          to="/files"
          search={DEFAULT_FILES_SEARCH}
          className="font-medium text-primary hover:underline"
        >
          {label}
        </Link>
      )
    case 'integration':
      return (
        <Link
          to="/integrations"
          search={DEFAULT_INTEGRATIONS_SEARCH}
          className="font-medium text-primary hover:underline"
        >
          {label}
        </Link>
      )
    default:
      return <span>{label}</span>
  }
}

export function NotificationDetailDrawer({
  notification,
  open,
  onOpenChange,
  onReadChange,
  pending,
}: {
  notification?: WorkspaceNotification
  open: boolean
  onOpenChange: (open: boolean) => void
  onReadChange: (notification: WorkspaceNotification, read: boolean) => void
  pending: boolean
}) {
  const { t, i18n } = useTranslation('notifications')
  const Icon = notification ? notificationIcon(notification.kind) : null

  return (
    <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        {notification ? (
          <>
            <DrawerHeader className="border-b">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  {Icon ? <Icon aria-hidden className="size-5" /> : null}
                </span>
                <div className="min-w-0 space-y-1">
                  <DrawerTitle className="text-base">
                    {notificationTitle(t, notification)}
                  </DrawerTitle>
                  <DrawerDescription>{notificationSummary(t, notification)}</DrawerDescription>
                </div>
              </div>
            </DrawerHeader>

            <div className="flex-1 space-y-5 overflow-y-auto p-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {notificationBody(t, notification)}
              </p>

              <dl className="grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">{t('detail.kind')}</dt>
                  <dd>{t(`kinds.${notification.kind}.label`)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">{t('detail.actor')}</dt>
                  <dd>{notification.actorName ?? t('detail.system')}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">{t('detail.entity')}</dt>
                  <dd className="text-right">
                    <EntityLink notification={notification} />
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">{t('detail.received')}</dt>
                  <dd>{formatDateTime(notification.createdAt, i18n.language)}</dd>
                </div>
              </dl>
            </div>

            <DrawerFooter className="border-t">
              <Button
                variant={notification.read ? 'outline' : 'default'}
                onClick={() => onReadChange(notification, !notification.read)}
                disabled={pending}
              >
                {notification.read ? t('actions.markUnread') : t('actions.markRead')}
              </Button>
            </DrawerFooter>
          </>
        ) : null}
      </DrawerContent>
    </Drawer>
  )
}
