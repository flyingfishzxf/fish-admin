import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useNavigate } from '@tanstack/react-router'
import { Inbox, SearchX } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { PageHeader } from '@/components/common/page-header'
import { ProTable } from '@/components/pro/pro-table/pro-table'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDocumentTitle } from '@/lib/document-title'
import type { WorkflowInstance } from '@/types'

import { useWorkflowListQuery } from '../queries'
import type { WorkflowSearch } from '../search'
import { createWorkflowColumns } from './workflow-columns'
import { WorkflowFilters } from './workflow-filters'

const VIEWS = ['mine', 'pending', 'all'] as const

export function WorkflowsPage({
  search,
  onSearchChange,
}: {
  search: WorkflowSearch
  onSearchChange: (updater: (previous: WorkflowSearch) => WorkflowSearch) => void
}) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  useDocumentTitle(t('workflows:title'))

  const [searchValue, setSearchValue] = useState(search.q ?? '')

  const query = useWorkflowListQuery({
    page: search.page,
    pageSize: search.pageSize,
    view: search.view,
    q: search.q,
    status: search.status,
    type: search.type,
    initiatorId: search.initiatorId,
    from: search.from,
    to: search.to,
  })

  const rows = useMemo(() => query.data?.items ?? [], [query.data])
  const total = query.data?.total ?? 0
  const pageCount = query.data?.pageCount ?? 1
  const hasFilters = Boolean(
    search.q || search.status || search.type || search.initiatorId || search.from || search.to,
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
      status: undefined,
      type: undefined,
      initiatorId: undefined,
      from: undefined,
      to: undefined,
      page: 1,
    }))
  }, [onSearchChange])

  const openWorkflow = useCallback(
    (instance: WorkflowInstance) => {
      void navigate({ to: '/workflows/$id', params: { id: instance.id } })
    },
    [navigate],
  )

  const columns = useMemo(
    () =>
      createWorkflowColumns({
        t,
        language: i18n.language,
        onOpen: openWorkflow,
      }),
    [t, i18n.language, openWorkflow],
  )

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    initialState: { columnPinning: { left: ['title'] } },
    manualPagination: true,
    pageCount,
  })

  const emptyState = hasFilters ? (
    <EmptyState
      icon={SearchX}
      title={t('workflows:empty.filteredTitle')}
      description={t('workflows:empty.filteredDescription')}
      action={
        <Button variant="outline" size="sm" onClick={clearFilters}>
          {t('workflows:empty.clear')}
        </Button>
      }
    />
  ) : (
    <EmptyState
      icon={Inbox}
      title={t(`workflows:empty.${search.view}Title`)}
      description={t(`workflows:empty.${search.view}Description`)}
    />
  )

  return (
    <div className="space-y-6">
      <PageHeader title={t('workflows:title')} description={t('workflows:subtitle')} />

      <Tabs
        value={search.view}
        onValueChange={(value) =>
          onSearchChange((previous) => ({
            ...previous,
            view: value as WorkflowSearch['view'],
            page: 1,
          }))
        }
      >
        <TabsList aria-label={t('workflows:views.label')}>
          {VIEWS.map((view) => (
            <TabsTrigger key={view} value={view}>
              {t(`workflows:views.${view}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {query.isError && !query.data ? (
        <ErrorState title={t('workflows:loadError')} onRetry={() => void query.refetch()} />
      ) : (
        <ProTable
          table={table}
          loading={query.isPending}
          fetching={query.isFetching && !query.isPending}
          fetchingLabel={t('common:states.loading')}
          empty={emptyState}
          onRowClick={openWorkflow}
          virtualized
          virtualRowHeight={64}
          virtualMaxHeight={800}
          scrollLabel={t('workflows:tableRegion')}
          search={{
            value: searchValue,
            onChange: setSearchValue,
            placeholder: t('workflows:searchPlaceholder'),
            ariaLabel: t('common:actions.search'),
            clearLabel: t('common:actions.clearSearch'),
          }}
          filters={
            <WorkflowFilters
              search={search}
              onSearchChange={onSearchChange}
              onClear={clearFilters}
            />
          }
          pagination={{
            page: query.data?.page ?? search.page,
            pageCount: Math.max(pageCount, 1),
            total,
            pageSize: search.pageSize,
            pageSizeOptions: [10, 20, 50],
            onPageChange: (page) => onSearchChange((previous) => ({ ...previous, page })),
            onPageSizeChange: (pageSize) =>
              onSearchChange((previous) => ({ ...previous, pageSize, page: 1 })),
          }}
        />
      )}
    </div>
  )
}
