import { apiRequest } from '@/lib/api-client'
import type { DictionaryDetail, DictionaryItem, DictionaryType } from '@/types'

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

export function reorderDictionaryItems(dictionaryId: string, ids: string[]) {
  return apiRequest<DictionaryDetail>(
    `/dictionaries/${encodeURIComponent(dictionaryId)}/items/reorder`,
    { method: 'PATCH', body: { ids } },
  )
}

export type { DictionaryItem, DictionaryType }
