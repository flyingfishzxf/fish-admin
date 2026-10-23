import type { ColumnDef } from '@tanstack/react-table'
import type { TFunction } from 'i18next'
import { ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { formatDateTime, formatRelativeTime } from '@/lib/format'
import type { AuditEvent } from '@/types'

import { auditMetadataSummary } from '../audit-metadata'
import { AuditActionBadge } from './audit-action-badge'
import { AuditEntityLink } from './entity-link'

export function createAuditColumns({
  t,
  language,
  onOpen,
}: {
  t: TFunction
  language: string
  onOpen: (event: AuditEvent) => void
}): ColumnDef<AuditEvent>[] {
  return [
    {
      accessorKey: 'createdAt',
      size: 190,
      minSize: 160,
      header: () => t('audit:columns.time'),
      meta: {
        label: t('audit:columns.time'),
        className: 'whitespace-nowrap',
      },
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <p className="text-sm">{formatDateTime(row.original.createdAt, language)}</p>
          <p className="text-xs text-muted-foreground">
            {formatRelativeTime(row.original.createdAt, language)}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'actorName',
      size: 160,
      minSize: 120,
      header: () => t('audit:columns.actor'),
      meta: {
        label: t('audit:columns.actor'),
        className: 'min-w-[120px]',
      },
      cell: ({ row }) => (
        <span className="block truncate text-sm">
          {row.original.actorName || t('audit:actorFallback')}
        </span>
      ),
    },
    {
      accessorKey: 'action',
      size: 190,
      minSize: 160,
      header: () => t('audit:columns.action'),
      meta: {
        label: t('audit:columns.action'),
      },
      cell: ({ row }) => <AuditActionBadge event={row.original} />,
    },
    {
      accessorKey: 'entityLabel',
      size: 220,
      minSize: 160,
      header: () => t('audit:columns.entity'),
      meta: {
        label: t('audit:columns.entity'),
      },
      cell: ({ row }) => {
        const event = row.original
        return (
          <div className="min-w-0 space-y-0.5">
            <AuditEntityLink
              entityType={event.entityType}
              entityId={event.entityId}
              className="block truncate text-sm font-medium hover:text-primary hover:underline focus-visible:underline focus-visible:outline-none"
              onClick={(clickEvent) => clickEvent.stopPropagation()}
            >
              {event.entityLabel}
            </AuditEntityLink>
            <p className="text-xs text-muted-foreground">
              {t(`audit:entities.${event.entityType}`)}
            </p>
          </div>
        )
      },
    },
    {
      id: 'metadata',
      size: 280,
      minSize: 180,
      enableSorting: false,
      header: () => t('audit:columns.metadata'),
      meta: {
        label: t('audit:columns.metadata'),
      },
      cell: ({ row }) => {
        const summary = auditMetadataSummary(row.original)
        return (
          <span className="line-clamp-2 block text-xs break-words text-muted-foreground">
            {summary || '—'}
          </span>
        )
      },
    },
    {
      id: 'details',
      size: 64,
      minSize: 64,
      maxSize: 64,
      enableSorting: false,
      header: () => <span className="sr-only">{t('audit:columns.details')}</span>,
      meta: {
        label: t('audit:columns.details'),
        className: 'text-right',
      },
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon-sm"
          className="ml-auto"
          aria-label={`${t('audit:detail.open')}: ${t(`audit:actions.${row.original.action}`)}`}
          onClick={(event) => {
            event.stopPropagation()
            onOpen(row.original)
          }}
        >
          <ChevronRight className="size-4" />
        </Button>
      ),
    },
  ]
}
