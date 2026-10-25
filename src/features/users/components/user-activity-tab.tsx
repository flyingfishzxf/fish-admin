import {
  Building2,
  FileText,
  FolderKanban,
  LogIn,
  Plug,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ErrorState } from '@/components/common/error-state'
import {
  Timeline,
  type TimelineItem,
  type TimelineTone,
} from '@/components/enterprise/timeline/timeline'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AUDIT_ACTION_TONES, type AuditTone } from '@/config/audit'
import { formatDateTime } from '@/lib/format'
import type { AuditEntityType } from '@/types'

import { useUserActivityQuery } from '../queries'

const TIMELINE_TONES: Record<AuditTone, TimelineTone> = {
  success: 'success',
  info: 'info',
  warning: 'warning',
  destructive: 'destructive',
  neutral: 'default',
}

const ENTITY_ICONS: Record<AuditEntityType, LucideIcon> = {
  user: UserRound,
  role: ShieldCheck,
  department: Building2,
  auth: LogIn,
  project: FolderKanban,
  file: FileText,
  integration: Plug,
}

export function UserActivityTab({ userId }: { userId: string }) {
  const { t, i18n } = useTranslation()
  const query = useUserActivityQuery(userId)

  const items: TimelineItem[] = (query.data?.items ?? []).map((event) => {
    const metadata = Object.entries(event.metadata)
      .filter(([key]) => key !== 'actorId')
      .slice(0, 2)
      .map(([key, value]) => `${key}: ${value}`)
      .join(' · ')

    return {
      id: event.id,
      title: t(`audit:actions.${event.action}`),
      description: (
        <span>
          {event.actorName || t('audit:actorFallback')}
          {metadata ? ` · ${metadata}` : null}
        </span>
      ),
      timestamp: formatDateTime(event.createdAt, i18n.language),
      icon: ENTITY_ICONS[event.entityType],
      tone: TIMELINE_TONES[AUDIT_ACTION_TONES[event.action]],
    }
  })

  return (
    <Card className="shadow-soft">
      <CardHeader className="gap-1">
        <CardTitle className="text-base">{t('audit:activity.title')}</CardTitle>
        <CardDescription>{t('audit:activity.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {query.isPending ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex gap-3">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-64" />
                </div>
              </div>
            ))}
          </div>
        ) : query.isError ? (
          <ErrorState
            title={t('audit:loadError')}
            onRetry={() => void query.refetch()}
            className="border-0 py-8"
          />
        ) : (
          <Timeline items={items} emptyLabel={t('audit:activity.empty')} />
        )}
      </CardContent>
    </Card>
  )
}
