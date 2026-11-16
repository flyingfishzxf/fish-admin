import { describe, expect, it } from 'vitest'

import {
  DEFAULT_WORKFLOWS_SEARCH,
  isValidDay,
  validateWorkflowsSearch,
  workflowRangePreset,
} from './search'

describe('isValidDay', () => {
  it('accepts a real calendar day and rejects the rest', () => {
    expect(isValidDay('2026-11-16')).toBe(true)
    expect(isValidDay('2026-02-29')).toBe(false)
    expect(isValidDay('2026-13-01')).toBe(false)
    expect(isValidDay('16-11-2026')).toBe(false)
    expect(isValidDay(20261116)).toBe(false)
  })
})

describe('workflowRangePreset', () => {
  const now = new Date(2026, 10, 16, 15, 30)

  it('covers today as a single day', () => {
    expect(workflowRangePreset('today', now)).toEqual({ from: '2026-11-16', to: '2026-11-16' })
  })

  it('counts the window inclusively', () => {
    expect(workflowRangePreset('last7', now)).toEqual({ from: '2026-11-10', to: '2026-11-16' })
    expect(workflowRangePreset('last30', now)).toEqual({ from: '2026-10-18', to: '2026-11-16' })
  })

  it('starts this month on the first', () => {
    expect(workflowRangePreset('thisMonth', now)).toEqual({ from: '2026-11-01', to: '2026-11-16' })
  })
})

describe('validateWorkflowsSearch', () => {
  it('fills in the defaults', () => {
    expect(validateWorkflowsSearch({})).toEqual(DEFAULT_WORKFLOWS_SEARCH)
  })

  it('keeps only known views, statuses and types', () => {
    expect(validateWorkflowsSearch({ view: 'team' }).view).toBe('pending')
    expect(validateWorkflowsSearch({ view: 'mine' }).view).toBe('mine')
    expect(validateWorkflowsSearch({ status: 'draft' }).status).toBeUndefined()
    expect(validateWorkflowsSearch({ status: 'approved' }).status).toBe('approved')
    expect(validateWorkflowsSearch({ type: 'refund' }).type).toBeUndefined()
    expect(validateWorkflowsSearch({ type: 'seal' }).type).toBe('seal')
  })

  it('swaps a backwards date range instead of returning nothing', () => {
    expect(validateWorkflowsSearch({ from: '2026-11-20', to: '2026-11-10' })).toMatchObject({
      from: '2026-11-10',
      to: '2026-11-20',
    })
  })

  it('drops a malformed day', () => {
    expect(validateWorkflowsSearch({ from: '2026-11-31' }).from).toBeUndefined()
  })

  it('clamps the page and the page size', () => {
    expect(validateWorkflowsSearch({ page: '0', pageSize: '5' })).toMatchObject({
      page: 1,
      pageSize: 10,
    })
    expect(validateWorkflowsSearch({ pageSize: '50' }).pageSize).toBe(50)
    expect(validateWorkflowsSearch({ pageSize: '500' }).pageSize).toBe(10)
  })
})
