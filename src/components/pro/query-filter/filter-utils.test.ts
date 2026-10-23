import { describe, expect, it } from 'vitest'

import {
  clearFilterValues,
  countActiveFilters,
  getActiveFilterIds,
  getFilterFieldId,
  isFilterFieldActive,
} from '@/components/pro/query-filter/filter-utils'
import type { FilterField } from '@/components/pro/query-filter/query-filter-types'

const fields: FilterField[] = [
  { type: 'text', name: 'q', label: 'Keyword' },
  {
    type: 'select',
    name: 'status',
    label: 'Status',
    options: [{ value: 'active', label: 'Active' }],
  },
  { type: 'dateRange', fromName: 'from', toName: 'to', label: 'Created' },
  { type: 'boolean', name: 'flagged', label: 'Flagged' },
  { type: 'custom', name: 'score', label: 'Score', render: () => null },
]

describe('filter utils', () => {
  it('counts no active filters for empty values', () => {
    expect(countActiveFilters(fields, {})).toBe(0)
    expect(countActiveFilters(fields, { q: '   ', status: '', flagged: false })).toBe(0)
  })

  it('treats text filters as active only when non-blank', () => {
    expect(countActiveFilters(fields, { q: 'ada' })).toBe(1)
    expect(isFilterFieldActive(fields[0]!, { q: 'ada' })).toBe(true)
    expect(isFilterFieldActive(fields[0]!, { q: '  ' })).toBe(false)
  })

  it('treats select filters as active when a value is set', () => {
    expect(countActiveFilters(fields, { status: 'active' })).toBe(1)
    expect(getActiveFilterIds(fields, { status: 'active' })).toEqual(['status'])
  })

  it('counts a date range once when either bound is set', () => {
    expect(countActiveFilters(fields, { from: '2026-01-01' })).toBe(1)
    expect(countActiveFilters(fields, { to: '2026-02-01' })).toBe(1)
    expect(countActiveFilters(fields, { from: '2026-01-01', to: '2026-02-01' })).toBe(1)
    expect(getActiveFilterIds(fields, { to: '2026-02-01' })).toEqual(['from'])
  })

  it('treats boolean filters as active only when true', () => {
    expect(countActiveFilters(fields, { flagged: true })).toBe(1)
    expect(countActiveFilters(fields, { flagged: false })).toBe(0)
  })

  it('counts custom values that are not empty', () => {
    expect(countActiveFilters(fields, { score: 0 })).toBe(1)
    expect(countActiveFilters(fields, { score: '' })).toBe(0)
  })

  it('collects active filter ids in field order', () => {
    expect(
      getActiveFilterIds(fields, {
        q: 'ada',
        status: 'active',
        from: '2026-01-01',
        flagged: true,
        score: 5,
      }),
    ).toEqual(['q', 'status', 'from', 'flagged', 'score'])
    expect(countActiveFilters(fields, { q: 'ada', flagged: true })).toBe(2)
  })

  it('uses the from name as the date range field id', () => {
    expect(getFilterFieldId(fields[2]!)).toBe('from')
    expect(getFilterFieldId(fields[0]!)).toBe('q')
  })

  it('clears every filter value', () => {
    expect(clearFilterValues(fields)).toEqual({})
  })
})
