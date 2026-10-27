import { beforeEach, describe, expect, it, vi } from 'vitest'

const { apiRequestMock } = vi.hoisted(() => ({ apiRequestMock: vi.fn() }))

vi.mock('@/lib/api-client', () => ({ apiRequest: apiRequestMock }))

import {
  createDictionary,
  createDictionaryItem,
  deleteDictionary,
  deleteDictionaryItem,
  fetchDictionaries,
  fetchDictionary,
  reorderDictionaryItems,
  updateDictionary,
  updateDictionaryItem,
} from './api'

describe('dictionaries API client', () => {
  const signal = new AbortController().signal

  beforeEach(() => {
    apiRequestMock.mockReset()
    apiRequestMock.mockResolvedValue(undefined)
  })

  it('loads the type list and one detail by id or code', () => {
    fetchDictionaries(signal)
    fetchDictionary('user_tag', signal)

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, '/dictionaries', { signal })
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, '/dictionaries/user_tag', { signal })
  })

  it('creates, updates and deletes a type', () => {
    createDictionary({ code: 'region', name: 'Regions' })
    updateDictionary('dict/1', { name: 'Sales regions' })
    deleteDictionary('dict/1')

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, '/dictionaries', {
      method: 'POST',
      body: { code: 'region', name: 'Regions' },
    })
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, '/dictionaries/dict%2F1', {
      method: 'PATCH',
      body: { name: 'Sales regions' },
    })
    expect(apiRequestMock).toHaveBeenNthCalledWith(3, '/dictionaries/dict%2F1', {
      method: 'DELETE',
    })
  })

  it('creates, updates, reorders and deletes items', () => {
    createDictionaryItem('dict-1', { label: 'Priority', value: 'priority' })
    updateDictionaryItem('dict-1', 'item/1', { enabled: false })
    reorderDictionaryItems('dict-1', ['item-2', 'item-1'])
    deleteDictionaryItem('dict-1', 'item/1')

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, '/dictionaries/dict-1/items', {
      method: 'POST',
      body: { label: 'Priority', value: 'priority' },
    })
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, '/dictionaries/dict-1/items/item%2F1', {
      method: 'PATCH',
      body: { enabled: false },
    })
    expect(apiRequestMock).toHaveBeenNthCalledWith(3, '/dictionaries/dict-1/items/reorder', {
      method: 'PATCH',
      body: { ids: ['item-2', 'item-1'] },
    })
    expect(apiRequestMock).toHaveBeenNthCalledWith(4, '/dictionaries/dict-1/items/item%2F1', {
      method: 'DELETE',
    })
  })
})
