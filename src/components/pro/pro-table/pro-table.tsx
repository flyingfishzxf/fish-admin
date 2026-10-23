import type { Table as TableInstance } from '@tanstack/react-table'
import { Loader2, Search, X } from 'lucide-react'
import type { ReactNode } from 'react'

import { DataTable, type DataTableDensity } from '@/components/data-table/data-table'
import { DataTablePagination } from '@/components/data-table/data-table-pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { BulkActionsBar } from './bulk-actions-bar'

export type ProTableSearchConfig = {
  value: string
  onChange: (value: string) => void
  placeholder: string
  ariaLabel: string
  clearLabel: string
}

export type ProTablePaginationConfig = {
  page: number
  pageCount: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  pageSizeOptions?: number[]
}

export type ProTableSelectionConfig = {
  count: number
  label: string
  regionLabel?: string
  clearLabel: string
  onClear: () => void
  children?: ReactNode
}

export type ProTableProps<TData> = {
  table: TableInstance<TData>
  loading?: boolean
  empty: ReactNode
  density?: DataTableDensity
  search?: ProTableSearchConfig
  filters?: ReactNode
  actions?: ReactNode
  toolbar?: ReactNode
  selection?: ProTableSelectionConfig
  pagination?: ProTablePaginationConfig
  fetching?: boolean
  fetchingLabel?: string
  rowContextMenu?: (row: TData) => ReactNode
  onRowClick?: (row: TData) => void
}

export function ProTable<TData>({
  table,
  loading = false,
  empty,
  density,
  search,
  filters,
  actions,
  toolbar,
  selection,
  pagination,
  fetching = false,
  fetchingLabel,
  rowContextMenu,
  onRowClick,
}: ProTableProps<TData>) {
  const defaultToolbar =
    search || filters || actions || fetching ? (
      <div
        data-slot="pro-table-toolbar"
        className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {search ? (
            <div className="relative w-full min-w-0 sm:w-auto sm:max-w-xs sm:flex-1">
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={search.value}
                onChange={(event) => search.onChange(event.target.value)}
                placeholder={search.placeholder}
                aria-label={search.ariaLabel}
                className="h-9 pl-9"
              />
              {search.value ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="absolute top-1/2 right-2 -translate-y-1/2"
                  aria-label={search.clearLabel}
                  onClick={() => search.onChange('')}
                >
                  <X aria-hidden className="size-3.5" />
                </Button>
              ) : null}
            </div>
          ) : null}
          {filters}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {fetching ? (
            <span role="status" className="inline-flex items-center">
              <Loader2 aria-hidden className="size-4 animate-spin text-muted-foreground" />
              <span className="sr-only">{fetchingLabel ?? 'Loading'}</span>
            </span>
          ) : null}
          {actions}
        </div>
      </div>
    ) : null

  return (
    <div data-slot="pro-table">
      <DataTable
        table={table}
        loading={loading}
        density={density}
        empty={empty}
        toolbar={toolbar ?? defaultToolbar}
        footer={
          pagination ? (
            <DataTablePagination
              page={pagination.page}
              pageCount={Math.max(1, pagination.pageCount)}
              total={pagination.total}
              pageSize={pagination.pageSize}
              onPageChange={pagination.onPageChange}
              onPageSizeChange={pagination.onPageSizeChange}
              pageSizeOptions={pagination.pageSizeOptions}
            />
          ) : undefined
        }
        rowContextMenu={rowContextMenu}
        onRowClick={onRowClick}
      />

      {selection && selection.count > 0 ? (
        <BulkActionsBar
          label={selection.label}
          regionLabel={selection.regionLabel}
          clearLabel={selection.clearLabel}
          onClear={selection.onClear}
        >
          {selection.children}
        </BulkActionsBar>
      ) : null}
    </div>
  )
}
