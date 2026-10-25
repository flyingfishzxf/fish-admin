import { Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ErrorState } from '@/components/common/error-state'
import {
  Descriptions,
  type DescriptionItem,
} from '@/components/enterprise/descriptions/descriptions'
import { JsonViewer } from '@/components/enterprise/json-viewer/json-viewer'
import {
  Timeline,
  type TimelineItem,
  type TimelineTone,
} from '@/components/enterprise/timeline/timeline'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { AUDIT_ACTION_ICONS, AUDIT_ACTION_TONES, type AuditTone } from '@/config/audit'
import { DEFAULT_FILES_SEARCH } from '@/features/files/search'
import { DEFAULT_INTEGRATIONS_SEARCH } from '@/features/integrations/search'
import { formatDateTime } from '@/lib/format'
import type { AuditEvent } from '@/types'

import { useAuditEventQuery } from '../queries'
import { AuditActionBadge } from './audit-action-badge'
import { AuditEntityLink } from './entity-link'

const TIMELINE_TONES: Record<AuditTone, TimelineTone> = {
  success: 'success',
  info: 'info',
  warning: 'warning',
  destructive: 'destructive',
  neutral: 'default',
}

function EntityButton({ event }: { event: AuditEvent }) {
  const { t } = useTranslation()
  if (!event.entityId) return null

  const label = (
    <>
      {t('audit:detail.viewEntity')}
      <ArrowUpRight className="size-3.5" />
    </>
  )

  if (event.entityType === 'user') {
    return (
      <Button asChild variant="outline" size="sm">
        <Link to="/users/$id" params={{ id: event.entityId }}>
          {label}
        </Link>
      </Button>
    )
  }

  if (event.entityType === 'role') {
    return (
      <Button asChild variant="outline" size="sm">
        <Link to="/roles/matrix">{label}</Link>
      </Button>
    )
  }

  if (event.entityType === 'department') {
    return (
      <Button asChild variant="outline" size="sm">
        <Link to="/departments" search={{ dept: event.entityId }}>
          {label}
        </Link>
      </Button>
    )
  }

  if (event.entityType === 'project') {
    return (
      <Button asChild variant="outline" size="sm">
        <Link to="/projects/$id" params={{ id: event.entityId }}>
          {label}
        </Link>
      </Button>
    )
  }

  if (event.entityType === 'file') {
    return (
      <Button asChild variant="outline" size="sm">
        <Link to="/files" search={{ ...DEFAULT_FILES_SEARCH, q: event.entityLabel || undefined }}>
          {label}
        </Link>
      </Button>
    )
  }

  if (event.entityType === 'integration') {
    return (
      <Button asChild variant="outline" size="sm">
        <Link to="/integrations" search={DEFAULT_INTEGRATIONS_SEARCH}>
          {label}
        </Link>
      </Button>
    )
  }

  return null
}

export function AuditDetailDrawer({
  eventId,
  onClose,
}: {
  eventId: string | null
  onClose: () => void
}) {
  const { t, i18n } = useTranslation()
  const query = useAuditEventQuery(eventId)
  const event = query.data?.event
  const related = query.data?.related ?? []

  const relatedItems: TimelineItem[] = related.map((item) => ({
    id: item.id,
    title: t(`audit:actions.${item.action}`),
    description: item.actorName || t('audit:actorFallback'),
    timestamp: formatDateTime(item.createdAt, i18n.language),
    icon: AUDIT_ACTION_ICONS[item.action],
    tone: TIMELINE_TONES[AUDIT_ACTION_TONES[item.action]],
  }))

  const items: DescriptionItem[] = event
    ? [
        {
          term: t('audit:columns.entity'),
          span: 2,
          description: (
            <div className="flex flex-wrap items-center gap-2">
              <AuditEntityLink
                entityType={event.entityType}
                entityId={event.entityId}
                className="font-medium hover:text-primary hover:underline focus-visible:underline focus-visible:outline-none"
              >
                {event.entityLabel}
              </AuditEntityLink>
              <span className="text-xs text-muted-foreground">
                {t(`audit:entities.${event.entityType}`)}
              </span>
            </div>
          ),
        },
        {
          term: t('audit:columns.action'),
          description: <AuditActionBadge event={event} />,
        },
        {
          term: t('audit:columns.actor'),
          description: event.actorName || t('audit:actorFallback'),
        },
        {
          term: t('audit:columns.time'),
          span: 2,
          description: formatDateTime(event.createdAt, i18n.language),
        },
        {
          term: t('audit:detail.eventId'),
          span: 2,
          description: (
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs break-all">{event.id}</code>
          ),
        },
      ]
    : []

  const hasMetadata = event ? Object.keys(event.metadata).length > 0 : false

  return (
    <Sheet open={Boolean(eventId)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b p-5 pr-12">
          <SheetTitle className="text-base">{t('audit:detail.title')}</SheetTitle>
          <SheetDescription>{t('audit:detail.description')}</SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {query.isPending ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          ) : query.isError ? (
            <ErrorState
              title={t('audit:loadError')}
              onRetry={() => void query.refetch()}
              className="border-0 py-10"
            />
          ) : event ? (
            <div className="space-y-6">
              <Descriptions items={items} columns={2} />

              {event.entityId ? <EntityButton event={event} /> : null}

              <section className="space-y-2">
                <h3 className="text-sm font-semibold">{t('audit:detail.metadata')}</h3>
                {hasMetadata ? (
                  <JsonViewer
                    value={event.metadata}
                    ariaLabel={t('audit:detail.metadata')}
                    className="max-h-60 overflow-auto"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">{t('audit:detail.noMetadata')}</p>
                )}
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold">{t('audit:detail.related')}</h3>
                <Timeline items={relatedItems} emptyLabel={t('audit:detail.noRelated')} />
              </section>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
