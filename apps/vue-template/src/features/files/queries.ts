import { keepPreviousData, queryOptions } from '@tanstack/vue-query'
import { computed, unref, type MaybeRef } from 'vue'

import { fetchFileFolders, fetchFiles, type FileListParams } from './api'

export const fileFoldersQueryOptions = queryOptions({
  queryKey: ['files', 'folders'],
  queryFn: ({ signal }) => fetchFileFolders(signal),
  // Folder counts change only when files move in or out, so a short staleness
  // window keeps the sidebar from refetching on every visit.
  staleTime: 30_000,
})

export function fileListQueryOptions(params: MaybeRef<FileListParams>) {
  return queryOptions({
    queryKey: computed(() => ['files', 'list', unref(params)]),
    queryFn: ({ signal }) => fetchFiles(unref(params), signal),
    placeholderData: keepPreviousData,
  })
}
