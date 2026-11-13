import { keepPreviousData, queryOptions } from '@tanstack/vue-query'

import { fetchDictionaries, fetchDictionary } from './api'

export const dictionaryKeys = {
  all: ['dictionaries'] as const,
  list: () => [...dictionaryKeys.all, 'list'] as const,
  detail: (idOrCode: string) => [...dictionaryKeys.all, 'detail', idOrCode] as const,
}

export const dictionaryListQueryOptions = queryOptions({
  queryKey: dictionaryKeys.list(),
  queryFn: ({ signal }) => fetchDictionaries(signal),
  placeholderData: keepPreviousData,
})

// An empty key means "nothing selected yet"; `enabled` keeps the request from
// firing against `/dictionaries/` and returning a 404 for the collection.
export function dictionaryDetailQueryOptions(idOrCode: string) {
  return queryOptions({
    queryKey: dictionaryKeys.detail(idOrCode),
    queryFn: ({ signal }) => fetchDictionary(idOrCode, signal),
    enabled: Boolean(idOrCode),
  })
}
