import { describe, expect, it } from 'vitest'

import { auditRangePreset, DEFAULT_AUDIT_SEARCH, isValidDay, validateAuditSearch } from './search'

describe('audit search', () => {
  it('falls back to defaults', () => {
    expect(validateAuditSearch({})).toEqual(DEFAULT_AUDIT_SEARCH)
  })

  it('clamps paging values', () => {
    expect(validateAuditSearch({ page: '-2', pageSize: '5' })).toMatchObject({
      page: 1,
      pageSize: 20,
    })
    expect(validateAuditSearch({ page: '3.8', pageSize: '500' })).toMatchObject({
      page: 3,
      pageSize: 20,
    })
    expect(validateAuditSearch({ pageSize: '50' }).pageSize).toBe(50)
  })

  it('keeps valid filters and trims the query', () => {
    expect(
      validateAuditSearch({
        q: '  ada  ',
        action: 'user.updated',
        entityType: 'user',
        from: '2026-10-01',
        to: '2026-10-23',
      }),
    ).toEqual({
      page: 1,
      pageSize: 20,
      q: 'ada',
      action: 'user.updated',
      entityType: 'user',
      from: '2026-10-01',
      to: '2026-10-23',
    })
  })

  it('drops unknown actions, entities and malformed dates', () => {
    expect(
      validateAuditSearch({
        action: 'user.exploded',
        entityType: 'planet',
        from: '2026-02-30',
        to: '10/23/2026',
      }),
    ).toEqual(DEFAULT_AUDIT_SEARCH)
  })

  it('swaps a reversed date range', () => {
    expect(validateAuditSearch({ from: '2026-10-23', to: '2026-10-01' })).toMatchObject({
      from: '2026-10-01',
      to: '2026-10-23',
    })
  })

  it('validates calendar days', () => {
    expect(isValidDay('2024-02-29')).toBe(true)
    expect(isValidDay('2026-02-29')).toBe(false)
    expect(isValidDay('2026-13-01')).toBe(false)
    expect(isValidDay('yesterday')).toBe(false)
  })

  it('computes inclusive presets from a fixed day', () => {
    const now = new Date(2026, 9, 23, 15, 30)
    expect(auditRangePreset('today', now)).toEqual({ from: '2026-10-23', to: '2026-10-23' })
    expect(auditRangePreset('last7', now)).toEqual({ from: '2026-10-17', to: '2026-10-23' })
    expect(auditRangePreset('last30', now)).toEqual({ from: '2026-09-24', to: '2026-10-23' })
    expect(auditRangePreset('last90', now)).toEqual({ from: '2026-07-26', to: '2026-10-23' })
    expect(auditRangePreset('thisMonth', now)).toEqual({ from: '2026-10-01', to: '2026-10-23' })
  })
})
