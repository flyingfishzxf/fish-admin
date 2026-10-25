import { describe, expect, it } from 'vitest'

import { DEFAULT_REPORTS_SEARCH, resolveReportRange, validateReportsSearch } from './search'

describe('reports search', () => {
  it('defaults to daily granularity without a range', () => {
    expect(validateReportsSearch({})).toEqual(DEFAULT_REPORTS_SEARCH)
  })

  it('keeps a valid date range and granularity', () => {
    expect(
      validateReportsSearch({ from: '2026-09-01', to: '2026-09-30', granularity: 'week' }),
    ).toEqual({ from: '2026-09-01', to: '2026-09-30', granularity: 'week' })
  })

  it('drops malformed, incomplete or reversed ranges', () => {
    expect(validateReportsSearch({ from: '2026-09-01', granularity: 'month' })).toEqual({
      granularity: 'month',
    })
    expect(validateReportsSearch({ from: '09/01/2026', to: '2026-09-30' })).toEqual({
      granularity: 'day',
    })
    expect(validateReportsSearch({ from: '2026-09-30', to: '2026-09-01' })).toEqual({
      granularity: 'day',
    })
  })

  it('falls back to daily for unknown granularities', () => {
    expect(validateReportsSearch({ granularity: 'quarter' })).toEqual({ granularity: 'day' })
  })

  it('resolves the default range as the last 30 days', () => {
    expect(resolveReportRange({ granularity: 'day' }, new Date(2026, 9, 25))).toEqual({
      from: '2026-09-26',
      to: '2026-10-25',
    })
  })

  it('resolves across a month boundary', () => {
    expect(resolveReportRange({ granularity: 'day' }, new Date(2026, 2, 1))).toEqual({
      from: '2026-01-31',
      to: '2026-03-01',
    })
  })

  it('prefers an explicit range', () => {
    expect(
      resolveReportRange(
        { from: '2026-01-05', to: '2026-01-09', granularity: 'day' },
        new Date(2026, 9, 25),
      ),
    ).toEqual({ from: '2026-01-05', to: '2026-01-09' })
  })
})
