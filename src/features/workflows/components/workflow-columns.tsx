import type { ColumnDef } from '@tanstack/react-table'
import type { TFunction } from 'i18next'
import { ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { formatCurrency, formatRelativeTime } from '@/lib/format'
import type { WorkflowInstance } from '@/types'

import { WorkflowStatusBadge, WorkflowTypeBadge } from './workflow-badges'

export function createWorkflowColumns({
  t,
  language,
  onOpen,
}: {
  t: TFunction
  language: string
  onOpen: (instance: WorkflowInstance) => void
}): ColumnDef<WorkflowInstance>[] {
  return [
    {
      accessorKey: 'title',
      size: 270,
      minSize: 220,
      header: () => t('workflows:columns.request'),
      meta: {
        label: t('workflows:columns.request'),
        group: 'request',
        groupLabel: t('workflows:columnGroups.request'),
      },
      cell: ({ row }) => (
        <div className="min-w-0 space-y-0.5">
          <p className="truncate text-sm font-medium">{row.original.title}</p>
          <p className="font-mono text-xs text-muted-foreground">{row.original.code}</p>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      size: 110,
      minSize: 100,
      header: () => t('workflows:columns.type'),
      meta: {
        label: t('workflows:columns.type'),
        group: 'state',
        groupLabel: t('workflows:columnGroups.state'),
      },
      cell: ({ row }) => (
        <WorkflowTypeBadge
          type={row.original.type}
          label={t(`workflows:types.${row.original.type}`)}
        />
      ),
    },
    {
      accessorKey: 'status',
      size: 110,
      minSize: 100,
      header: () => t('workflows:columns.status'),
      meta: {
        label: t('workflows:columns.status'),
        group: 'state',
        groupLabel: t('workflows:columnGroups.state'),
      },
      cell: ({ row }) => (
        <WorkflowStatusBadge
          status={row.original.status}
          label={t(`workflows:status.${row.original.status}`)}
        />
      ),
    },
    {
      accessorKey: 'initiatorName',
      size: 150,
      minSize: 120,
      header: () => t('workflows:columns.initiator'),
      meta: {
        label: t('workflows:columns.initiator'),
        group: 'people',
        groupLabel: t('workflows:columnGroups.people'),
      },
      cell: ({ row }) => (
        <span className="block truncate text-sm">{row.original.initiatorName}</span>
      ),
    },
    {
      accessorKey: 'currentApproverName',
      size: 150,
      minSize: 120,
      header: () => t('workflows:columns.approver'),
      meta: {
        label: t('workflows:columns.approver'),
        group: 'people',
        groupLabel: t('workflows:columnGroups.people'),
      },
      cell: ({ row }) => (
        <span className="block truncate text-sm">
          {row.original.status === 'pending'
            ? (row.original.currentApproverName ?? '—')
            : t('workflows:columns.closed')}
        </span>
      ),
    },
    {
      accessorKey: 'amount',
      size: 120,
      minSize: 100,
      header: () => t('workflows:columns.amount'),
      meta: {
        label: t('workflows:columns.amount'),
        className: 'text-right',
        group: 'details',
        groupLabel: t('workflows:columnGroups.details'),
      },
      cell: ({ row }) => (
        <span className="block text-right text-sm tabular-nums">
          {row.original.amount === undefined ? '—' : formatCurrency(row.original.amount, language)}
        </span>
      ),
    },
    {
      accessorKey: 'updatedAt',
      size: 130,
      minSize: 120,
      header: () => t('workflows:columns.updated'),
      meta: {
        label: t('workflows:columns.updated'),
        className: 'whitespace-nowrap',
        group: 'details',
        groupLabel: t('workflows:columnGroups.details'),
      },
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatRelativeTime(row.original.updatedAt, language)}
        </span>
      ),
    },
    {
      id: 'open',
      size: 56,
      minSize: 56,
      maxSize: 56,
      enableSorting: false,
      header: () => <span className="sr-only">{t('workflows:columns.open')}</span>,
      meta: {
        label: t('workflows:columns.open'),
        className: 'text-right',
        group: 'actions',
        groupLabel: '',
      },
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon-sm"
          className="ml-auto"
          aria-label={`${t('workflows:columns.open')}: ${row.original.title}`}
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
