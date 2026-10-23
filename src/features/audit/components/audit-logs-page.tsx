import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { ScrollText, SearchX } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { PageHeader } from '@/components/common/page-header'
import { DataTable } from '@/components/data-table/data-table'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/lib/document-title'
import type { AuditEvent } from '@/types'

import { useAuditListQuery } from '../queries'
import type { AuditSearch } from '../search'
import { createAuditColumns } from './audit-columns'
import { AuditDetailDrawer } from './audit-detail-drawer'
import { AuditFilters } from './audit-filters'

export function AuditLogsPage({
  search,
  onSearchChange,
}: {
  search: AuditSearch
  onSearchChange: (updater: (previous: AuditSearch) => AuditSearch) => void
}) {
  const { t, i18n } = useTranslation()
  useDocumentTitle(t('audit:title'))

  const [searchValue, setSearchValue] = useState(search.q ?? '')
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  const query = useAuditListQuery({
    page: search.page,
    pageSize: search.pageSize,
    q: search.q,
    action: search.action,
    entityType: search.entityType,
    from: search.from,
    to: search.to,
  })

  const rows = useMemo(() => query.data?.items ?? [], [query.data])
  const total = query.data?.total ?? 0
  const pageCount = query.data?.pageCount ?? 1
  const hasFilters = Boolean(
    search.q || search.action || search.entityType || search.from || search.to,
  )

  useEffect(() => {
    setSearchValue(search.q ?? '')
  }, [search.q])

  useEffect(() => {
    const trimmed = searchValue.trim()
    if (trimmed === (search.q ?? '')) return
    const timer = window.setTimeout(() => {
      onSearchChange((previous) => ({
        ...previous,
        q: trimmed || undefined,
        page: 1,
      }))
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchValue, search.q, onSearchChange])

  useEffect(() => {
    const serverPage = query.data?.page
    if (!query.isPlaceholderData && serverPage && serverPage !== search.page) {
      onSearchChange((previous) => ({ ...previous, page: serverPage }))
    }
  }, [query.data?.page, query.isPlaceholderData, search.page, onSearchChange])

  const clearFilters = useCallback(() => {
    setSearchValue('')
    onSearchChange((previous) => ({
      ...previous,
      q: undefined,
      action: undefined,
      entityType: undefined,
      from: undefined,
      to: undefined,
      page: 1,
    }))
  }, [onSearchChange])

  const openEvent = useCallback((event: AuditEvent) => {
    setSelectedEventId(event.id)
  }, [])

  const columns = useMemo(
    () =>
      createAuditColumns({
        t,
        language: i18n.language,
        onOpen: openEvent,
      }),
    [t, i18n.language, openEvent],
  )

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    manualPagination: true,
    pageCount,
  })

  const emptyState = hasFilters ? (
    <EmptyState
      icon={SearchX}
      title={t('audit:empty.title')}
      description={t('audit:empty.description')}
      action={
        <Button variant="outline" size="sm" onClick={clearFilters}>
          {t('audit:empty.action')}
        </Button>
      }
    />
  ) : (
    <EmptyState
      icon={ScrollText}
      title={t('audit:empty.title')}
      description={t('audit:empty.unfiltered')}
    />
  )

  return (
    <div className="space-y-6">
      <PageHeader title={t('audit:title')} description={t('audit:subtitle')} />

      {query.isError && !query.data ? (
        <ErrorState title={t('audit:loadError')} onRetry={() => void query.refetch()} />
      ) : (
        <DataTable
          table={table}
          loading={query.isPending}
          empty={emptyState}
          onRowClick={openEvent}
          toolbar={
            <AuditFilters
              search={search}
              searchValue={searchValue}
              onSearchValueChange={setSearchValue}
              onSearchChange={onSearchChange}
              onClear={clearFilters}
              fetching={query.isFetching && !query.isPending}
            />
          }
          footer={
            <DataTablePagination
              page={query.data?.page ?? search.page}
              pageCount={Math.max(pageCount, 1)}
              total={total}
              pageSize={search.pageSize}
              onPageChange={(page) => onSearchChange((previous) => ({ ...previous, page }))}
              onPageSizeChange={(pageSize) =>
                onSearchChange((previous) => ({ ...previous, pageSize, page: 1 }))
              }
            />
          }
        />
      )}

      <AuditDetailDrawer eventId={selectedEventId} onClose={() => setSelectedEventId(null)} />
    </div>
  )
}
