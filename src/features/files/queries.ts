import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'

import { fetchFileFolders, fetchFiles, type FileListParams } from './api'

export const fileFoldersQueryOptions = () =>
  queryOptions({
    queryKey: ['files', 'folders'],
    queryFn: fetchFileFolders,
    staleTime: 30_000,
  })

export function useFileFoldersQuery() {
  return useQuery(fileFoldersQueryOptions())
}

export const fileListQueryOptions = (params: FileListParams) =>
  queryOptions({
    queryKey: ['files', 'list', params],
    queryFn: () => fetchFiles(params),
    placeholderData: keepPreviousData,
  })

export function useFileListQuery(params: FileListParams) {
  return useQuery(fileListQueryOptions(params))
}
