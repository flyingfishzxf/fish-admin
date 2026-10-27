import type { ReactNode } from 'react'

export type FilterOption = {
  value: string
  label: string
}

export type FilterField =
  | {
      type: 'text'
      name: string
      label: string
      placeholder?: string
    }
  | {
      type: 'select'
      name: string
      label: string
      options: FilterOption[]
      allLabel?: string
    }
  | {
      type: 'dateRange'
      fromName: string
      toName: string
      label: string
      placeholder?: string
    }
  | {
      type: 'boolean'
      name: string
      label: string
    }
  | {
      type: 'custom'
      name: string
      label: string
      render: (value: unknown, onChange: (value: unknown) => void) => ReactNode
    }

export type FilterValue = Record<string, unknown>
