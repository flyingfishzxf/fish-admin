import { describe, expect, it } from 'vitest'

import { moveColumnOrder } from './column-order'

const ORDER = ['select', 'name', 'email', 'role', 'status']

describe('moveColumnOrder', () => {
  it('moves a column before its target', () => {
    expect(moveColumnOrder(ORDER, 'status', 'email')).toEqual([
      'select',
      'name',
      'status',
      'email',
      'role',
    ])
  })

  it('keeps the moved column on the same side of the target', () => {
    // Moving email after role must not jump back before it.
    expect(moveColumnOrder(ORDER, 'email', 'role')).toEqual([
      'select',
      'name',
      'role',
      'email',
      'status',
    ])
  })

  it('returns the input untouched for a no-op', () => {
    expect(moveColumnOrder(ORDER, 'name', 'name')).toBe(ORDER)
    expect(moveColumnOrder(ORDER, 'missing', 'name')).toBe(ORDER)
    expect(moveColumnOrder(ORDER, 'name', 'missing')).toBe(ORDER)
  })
})
