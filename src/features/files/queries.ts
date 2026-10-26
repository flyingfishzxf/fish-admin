import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'

import { fetchFileFolders, fetchFiles, type FileListParams } from './api'

export const fileFoldersQueryOptions = () =>
  queryOptions({
    queryKey: ['files', 'folders'],
    queryFn: ({ signal }) => fetchFileFolders(signal),
    staleTime: 30_000,
  })

export function useFileFoldersQuery() {
  return useQuery(fileFoldersQueryOptions())
}

export const fileListQueryOptions = (params: FileListParams) =>
  queryOptions({
    queryKey: ['files', 'list', params],
    queryFn: ({ signal }) => fetchFiles(params, signal),
    placeholderData: keepPreviousData,
  })

export function useFileListQuery(params: FileListParams) {
  return useQuery(fileListQueryOptions(params))
}
