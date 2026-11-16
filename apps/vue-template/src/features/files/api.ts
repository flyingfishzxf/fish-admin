import type { FileFolder, PaginatedResult, WorkspaceFile } from '@fish-admin/contracts'

import { apiRequest } from '../../lib/api-client'

export interface FileFolderSummary extends FileFolder {
  fileCount: number
}

export interface FileFolderStats {
  folders: FileFolderSummary[]
  total: number
  favorites: number
}

export interface FileListParams {
  page: number
  pageSize: number
  folderId?: string
  q?: string
  kind?: string
  visibility?: WorkspaceFile['visibility']
  favorite?: boolean
  sort?: string
  order?: string
  updatedAfter?: string
}

export const FILE_UPLOAD_TIMEOUT_MS = 60_000

export function fetchFileFolders(signal?: AbortSignal) {
  return apiRequest<FileFolderStats>('/file-folders', { signal })
}

export function fetchFiles(params: FileListParams, signal?: AbortSignal) {
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

  return apiRequest<PaginatedResult<WorkspaceFile>>(`/files?${search.toString()}`, { signal })
}

export interface FileUploadInput {
  name: string
  mime: string
  size: number
  folderId: string
  visibility?: WorkspaceFile['visibility']
  dataUrl?: string
}

export function uploadFile(input: FileUploadInput) {
  // Uploads carry a data URL, so they need a longer deadline than a list call.
  return apiRequest<WorkspaceFile>('/files', {
    method: 'POST',
    body: input,
    timeoutMs: FILE_UPLOAD_TIMEOUT_MS,
  })
}

export interface FileUpdateInput {
  name?: string
  folderId?: string
  visibility?: WorkspaceFile['visibility']
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
