import { AtSign, FolderKanban, PlugZap, UserPlus } from 'lucide-react'
import type { TFunction } from 'i18next'

import type { WorkspaceNotification } from '@/types'

const KIND_ICONS = {
  mention: AtSign,
  invite: UserPlus,
  project: FolderKanban,
  system: PlugZap,
} as const

export function notificationIcon(kind: WorkspaceNotification['kind']) {
  return KIND_ICONS[kind]
}

export function notificationTitle(t: TFunction, notification: WorkspaceNotification) {
  return t(`kinds.${notification.kind}.title`, {
    actor: notification.actorName ?? t('kinds.unknownActor'),
    entity: notification.entityLabel ?? t('kinds.somewhere'),
  })
}

export function notificationSummary(t: TFunction, notification: WorkspaceNotification) {
  return t(`kinds.${notification.kind}.summary`, {
    actor: notification.actorName ?? t('kinds.unknownActor'),
    entity: notification.entityLabel ?? t('kinds.somewhere'),
  })
}

export function notificationBody(t: TFunction, notification: WorkspaceNotification) {
  return t(`kinds.${notification.kind}.body`, {
    actor: notification.actorName ?? t('kinds.unknownActor'),
    entity: notification.entityLabel ?? t('kinds.somewhere'),
  })
}
