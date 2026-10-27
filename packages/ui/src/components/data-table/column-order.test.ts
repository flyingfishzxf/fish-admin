import { describe, expect, it } from 'vitest'

import { moveColumnOrder } from './column-order'

const ORDER = ['select', 'name', 'email', 'role', 'status', 'actions']

describe('moveColumnOrder', () => {
  it('moves a column down past its neighbour', () => {
    expect(moveColumnOrder(ORDER, 'email', 'role')).toEqual([
      'select',
      'name',
      'role',
      'email',
      'status',
      'actions',
    ])
  })

  it('moves a column up past its neighbour', () => {
    expect(moveColumnOrder(ORDER, 'status', 'role')).toEqual([
      'select',
      'name',
      'email',
      'status',
      'role',
      'actions',
    ])
  })

  it('moves a column to the start and the end', () => {
    expect(moveColumnOrder(ORDER, 'actions', 'select')).toEqual([
      'actions',
      'select',
      'name',
      'email',
      'role',
      'status',
    ])
    expect(moveColumnOrder(ORDER, 'select', 'actions')).toEqual([
      'name',
      'email',
      'role',
      'status',
      'actions',
      'select',
    ])
  })

  it('keeps the input order when ids are unknown or identical', () => {
    expect(moveColumnOrder(ORDER, 'email', 'email')).toBe(ORDER)
    expect(moveColumnOrder(ORDER, 'missing', 'role')).toBe(ORDER)
    expect(moveColumnOrder(ORDER, 'email', 'missing')).toBe(ORDER)
  })
})
