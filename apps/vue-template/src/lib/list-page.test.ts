import { describe, expect, it } from 'vitest'

import { clampToPageCount } from './list-page'

describe('clampToPageCount', () => {
  it('brings an out-of-range page back to the last available one', () => {
    expect(clampToPageCount(2, 1)).toBe(1)
    expect(clampToPageCount(7, 3)).toBe(3)
  })

  it('leaves normal paging, filtering and sorting alone', () => {
    expect(clampToPageCount(1, 3)).toBe(1)
    expect(clampToPageCount(2, 2)).toBe(2)
    expect(clampToPageCount(3, 5)).toBe(3)
  })

  it('ignores placeholder data from the previous query key', () => {
    expect(clampToPageCount(3, 1, true)).toBe(3)
    expect(clampToPageCount(1, 1, true)).toBe(1)
  })

  it('waits for the first response instead of guessing', () => {
    expect(clampToPageCount(2, undefined)).toBe(2)
  })

  it('treats a zero page count as a single empty page', () => {
    expect(clampToPageCount(1, 0)).toBe(1)
    expect(clampToPageCount(4, 0)).toBe(1)
  })
})
