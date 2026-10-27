import { describe, expect, it } from 'vitest'

import {
  filterTransferItems,
  groupTransferItems,
  splitTransferItems,
  toggleTransferKeys,
  toggleTransferValue,
  transferKeysState,
} from './transfer-utils'

const items = [
  { key: 'a', label: 'Alpha', group: 'Letters' },
  { key: 'b', label: 'Beta', description: 'Second letter', group: 'Letters' },
  { key: 'c', label: 'Gamma', group: 'Numbers' },
]

describe('transfer helpers', () => {
  it('splits items by the selected value', () => {
    const { source, target } = splitTransferItems(items, ['b'])

    expect(source.map((item) => item.key)).toEqual(['a', 'c'])
    expect(target.map((item) => item.key)).toEqual(['b'])
  })

  it('filters by label, description and search text', () => {
    expect(filterTransferItems(items, 'second').map((item) => item.key)).toEqual(['b'])
    expect(filterTransferItems(items, 'gamma').map((item) => item.key)).toEqual(['c'])
    expect(filterTransferItems(items, '  ')).toHaveLength(3)
  })

  it('groups items preserving their order', () => {
    expect(groupTransferItems(items).map((group) => group.key)).toEqual(['Letters', 'Numbers'])
    expect(groupTransferItems(items)[0]?.items).toHaveLength(2)
  })

  it('toggles single keys without reordering', () => {
    expect(toggleTransferValue(['a'], 'b')).toEqual(['a', 'b'])
    expect(toggleTransferValue(['a', 'b'], 'a')).toEqual(['b'])
  })

  it('toggles a group of keys between all and none', () => {
    expect(toggleTransferKeys(['a'], ['b', 'c'])).toEqual(['a', 'b', 'c'])
    expect(toggleTransferKeys(['a', 'b', 'c'], ['b', 'c'])).toEqual(['a'])
    expect(toggleTransferKeys(['a'], [])).toEqual(['a'])
  })

  it('reports the group selection state', () => {
    expect(transferKeysState([], ['a', 'b'])).toBe('none')
    expect(transferKeysState(['a'], ['a', 'b'])).toBe('some')
    expect(transferKeysState(['a', 'b'], ['a', 'b'])).toBe('all')
    expect(transferKeysState(['a'], [])).toBe('none')
  })
})
