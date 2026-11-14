import type { WorkspaceNotification } from '@fish-admin/contracts'
import { AtSign, FolderKanban, PlugZap, UserPlus } from 'lucide-vue-next'

const KIND_ICONS = {
  mention: AtSign,
  invite: UserPlus,
  project: FolderKanban,
  system: PlugZap,
} as const

type Translate = (key: string, options?: Record<string, unknown>) => string

export function notificationIcon(kind: WorkspaceNotification['kind']) {
  return KIND_ICONS[kind]
}

function substitutions(t: Translate, notification: WorkspaceNotification) {
  return {
    actor: notification.actorName ?? t('kinds.unknownActor'),
    entity: notification.entityLabel ?? t('kinds.somewhere'),
  }
}

export function notificationTitle(t: Translate, notification: WorkspaceNotification) {
  return t(`kinds.${notification.kind}.title`, substitutions(t, notification))
}

export function notificationSummary(t: Translate, notification: WorkspaceNotification) {
  return t(`kinds.${notification.kind}.summary`, substitutions(t, notification))
}

export function notificationBody(t: Translate, notification: WorkspaceNotification) {
  return t(`kinds.${notification.kind}.body`, substitutions(t, notification))
}

/** Compact relative time: the inbox is scanned, not read line by line. */
export function relativeTime(iso: string, now = Date.now()) {
  const then = new Date(iso).getTime()
  if (!Number.isFinite(then)) return ''
  const minutes = Math.round((then - now) / 60_000)
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return formatter.format(hours, 'hour')
  return formatter.format(Math.round(hours / 24), 'day')
}
