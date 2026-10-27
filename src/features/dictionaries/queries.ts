import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'

import { fetchDictionaries, fetchDictionary } from './api'

export const dictionaryKeys = {
  all: ['dictionaries'] as const,
  list: () => [...dictionaryKeys.all, 'list'] as const,
  detail: (idOrCode: string) => [...dictionaryKeys.all, 'detail', idOrCode] as const,
}

export const dictionaryListQueryOptions = () =>
  queryOptions({
    queryKey: dictionaryKeys.list(),
    queryFn: ({ signal }) => fetchDictionaries(signal),
    placeholderData: keepPreviousData,
  })

export function useDictionaryListQuery() {
  return useQuery(dictionaryListQueryOptions())
}

export const dictionaryDetailQueryOptions = (idOrCode: string) =>
  queryOptions({
    queryKey: dictionaryKeys.detail(idOrCode),
    queryFn: ({ signal }) => fetchDictionary(idOrCode, signal),
  })

export function useDictionaryDetailQuery(idOrCode: string | undefined) {
  return useQuery({
    ...dictionaryDetailQueryOptions(idOrCode ?? ''),
    enabled: Boolean(idOrCode),
  })
}

/** Enabled labels for one dictionary, e.g. tag suggestions on the user profile. */
export const dictionaryOptionsQueryOptions = (code: string) =>
  queryOptions({
    queryKey: dictionaryKeys.detail(code),
    queryFn: ({ signal }) => fetchDictionary(code, signal),
    select: (data) =>
      data.items
        .filter((item) => item.enabled)
        .map((item) => ({ label: item.label, value: item.value })),
    staleTime: 60_000,
  })

export function useDictionaryOptionsQuery(code: string, enabled = true) {
  return useQuery({ ...dictionaryOptionsQueryOptions(code), enabled })
}
