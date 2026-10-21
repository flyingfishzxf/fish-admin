import {
  LogIn,
  Pencil,
  RotateCcw,
  ShieldCheck,
  Trash2,
  UserPlus,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/common/empty-state'
import { formatRelativeTime } from '@/lib/format'
import type { ActivityAction, ActivityItem } from '@/types'

const ACTION_ICONS: Record<ActivityAction, LucideIcon> = {
  'user.created': UserPlus,
  'user.updated': Pencil,
  'user.deleted': Trash2,
  'user.restored': RotateCcw,
  'role.updated': ShieldCheck,
  'auth.login': LogIn,
  'profile.updated': UserRound,
}

const ACTION_TILES: Record<ActivityAction, string> = {
  'user.created': 'bg-chart-3/14 text-chart-3',
  'user.updated': 'bg-chart-1/12 text-chart-1',
  'user.deleted': 'bg-destructive/10 text-destructive',
  'user.restored': 'bg-chart-3/14 text-chart-3',
  'role.updated': 'bg-chart-4/16 text-chart-4',
  'auth.login': 'bg-chart-2/14 text-chart-2',
  'profile.updated': 'bg-muted text-muted-foreground',
}

export function ActivityList({ items }: { items: ActivityItem[] }) {
  const { t, i18n } = useTranslation('dashboard')

  if (items.length === 0) {
    return <EmptyState title={t('activity.empty')} className="py-10" />
  }

  return (
    <ul className="divide-y divide-border">
      {items.map((item) => {
        const Icon = ACTION_ICONS[item.action]
        return (
          <li key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <span
              className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${ACTION_TILES[item.action]}`}
            >
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="text-sm leading-snug">
                {t(`activity.${item.action}`, {
                  actor: item.actorName,
                  target: item.target,
                })}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatRelativeTime(item.createdAt, i18n.language)}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
