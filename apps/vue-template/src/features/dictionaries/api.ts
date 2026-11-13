import type { DictionaryDetail, DictionaryType } from '@fish-admin/contracts'

import { apiRequest } from '../../lib/api-client'

export interface DictionaryInput {
  code?: string
  name: string
  description?: string
}

export interface DictionaryItemInput {
  label: string
  value: string
  description?: string
  enabled?: boolean
}

// `GET /dictionaries` returns every type with its counts, so the page never
// pages the left rail. The detail endpoint is fetched separately because it is
// the only place that carries the items, and an item edit invalidates it.
export function fetchDictionaries(signal?: AbortSignal) {
  return apiRequest<DictionaryType[]>('/dictionaries', { signal })
}

export function fetchDictionary(idOrCode: string, signal?: AbortSignal) {
  return apiRequest<DictionaryDetail>(`/dictionaries/${encodeURIComponent(idOrCode)}`, { signal })
}

export function createDictionary(input: DictionaryInput) {
  return apiRequest<DictionaryDetail>('/dictionaries', { method: 'POST', body: input })
}

export function updateDictionary(id: string, input: Partial<DictionaryInput>) {
  return apiRequest<DictionaryDetail>(`/dictionaries/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: input,
  })
}

export function deleteDictionary(id: string) {
  return apiRequest<void>(`/dictionaries/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function createDictionaryItem(dictionaryId: string, input: DictionaryItemInput) {
  return apiRequest<DictionaryDetail>(`/dictionaries/${encodeURIComponent(dictionaryId)}/items`, {
    method: 'POST',
    body: input,
  })
}

export function updateDictionaryItem(
  dictionaryId: string,
  itemId: string,
  input: Partial<DictionaryItemInput>,
) {
  return apiRequest<DictionaryDetail>(
    `/dictionaries/${encodeURIComponent(dictionaryId)}/items/${encodeURIComponent(itemId)}`,
    { method: 'PATCH', body: input },
  )
}

export function deleteDictionaryItem(dictionaryId: string, itemId: string) {
  return apiRequest<void>(
    `/dictionaries/${encodeURIComponent(dictionaryId)}/items/${encodeURIComponent(itemId)}`,
    { method: 'DELETE' },
  )
}

// The mock handler rejects a partial order, so callers always send every item
// id exactly once (`PATCH /dictionaries/:id/items/reorder`).
export function reorderDictionaryItems(dictionaryId: string, ids: string[]) {
  return apiRequest<DictionaryDetail>(
    `/dictionaries/${encodeURIComponent(dictionaryId)}/items/reorder`,
    { method: 'PATCH', body: { ids } },
  )
}
