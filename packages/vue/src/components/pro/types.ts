import type { Table } from '@tanstack/vue-table'

export type ProTableSearchConfig = {
  value: string
  onChange: (value: string) => void
  placeholder: string
  ariaLabel: string
  clearLabel: string
}

export type ProTableSelectionConfig = {
  count: number
  label: string
  regionLabel?: string
  clearLabel: string
  onClear: () => void
}

export type ProTableProps<TData> = {
  table: Table<TData>
  tableLabel?: string
  loading?: boolean
  density?: 'comfortable' | 'compact'
  search?: ProTableSearchConfig
  selection?: ProTableSelectionConfig
  fetching?: boolean
  fetchingLabel?: string
  onRowClick?: (row: TData) => void
}
