import type { FileFolder, FileVisibility, PaginatedResult, WorkspaceFile } from '@/types'
import { apiRequest } from '@/lib/api-client'

import type { FileKind, FileOrder, FileSort } from './search'

export interface FileListParams {
  page: number
  pageSize: number
  folderId?: string
  q?: string
  kind?: FileKind
  visibility?: FileVisibility
  favorite?: boolean
  sort?: FileSort
  order?: FileOrder
  updatedAfter?: string
}

export interface FileFolderSummary extends FileFolder {
  fileCount: number
}

export interface FileFolderStats {
  folders: FileFolderSummary[]
  total: number
  favorites: number
}

export function fetchFileFolders() {
  return apiRequest<FileFolderStats>('/file-folders')
}

export function fetchFiles(params: FileListParams) {
  const search = new URLSearchParams()
  search.set('page', String(params.page))
  search.set('pageSize', String(params.pageSize))
  if (params.folderId) search.set('folderId', params.folderId)
  if (params.q) search.set('q', params.q)
  if (params.kind && params.kind !== 'all') search.set('kind', params.kind)
  if (params.visibility) search.set('visibility', params.visibility)
  if (params.favorite) search.set('favorite', '1')
  if (params.sort) search.set('sort', params.sort)
  if (params.order) search.set('order', params.order)
  if (params.updatedAfter) search.set('updatedAfter', params.updatedAfter)

  return apiRequest<PaginatedResult<WorkspaceFile>>(`/files?${search.toString()}`)
}

export interface FileUploadInput {
  name: string
  mime: string
  size: number
  folderId: string
  visibility?: FileVisibility
  dataUrl?: string
}

export function uploadFile(input: FileUploadInput) {
  return apiRequest<WorkspaceFile>('/files', { method: 'POST', body: input })
}

export interface FileUpdateInput {
  name?: string
  folderId?: string
  visibility?: FileVisibility
  favorite?: boolean
}

export function updateFile(id: string, input: FileUpdateInput) {
  return apiRequest<WorkspaceFile>(`/files/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: input,
  })
}

export function deleteFile(id: string) {
  return apiRequest<void>(`/files/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function deleteFiles(ids: string[]) {
  return apiRequest<{ deleted: number }>('/files/bulk-delete', {
    method: 'POST',
    body: { ids },
  })
}
