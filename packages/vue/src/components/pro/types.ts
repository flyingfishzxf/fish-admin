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
  loading?: boolean
  search?: ProTableSearchConfig
  selection?: ProTableSelectionConfig
  fetching?: boolean
  fetchingLabel?: string
}
