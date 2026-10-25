import type { FileVisibility } from '@/types'

export type FilesView = 'grid' | 'list'
export type FileKind = 'all' | 'image' | 'document' | 'data'
export type FileSort = 'updatedAt' | 'name' | 'size'
export type FileOrder = 'asc' | 'desc'
export type FileVisibilityFilter = 'all' | FileVisibility

export interface FilesSearch {
  page: number
  pageSize: number
  folderId?: string
  q?: string
  kind: FileKind
  visibility: FileVisibilityFilter
  favorite: boolean
  view: FilesView
  sort: FileSort
  order: FileOrder
  updatedAfter?: string
}

const KINDS: FileKind[] = ['all', 'image', 'document', 'data']
const SORTS: FileSort[] = ['updatedAt', 'name', 'size']
const VISIBILITIES: FileVisibilityFilter[] = ['all', 'team', 'private']
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export const DEFAULT_FILES_SEARCH: FilesSearch = {
  page: 1,
  pageSize: 12,
  kind: 'all',
  visibility: 'all',
  favorite: false,
  view: 'grid',
  sort: 'updatedAt',
  order: 'desc',
}

export function validateFilesSearch(search: Record<string, unknown>): FilesSearch {
  const page = Number(search.page)
  const pageSize = Number(search.pageSize)
  const updatedAfter =
    typeof search.updatedAfter === 'string' && DAY_PATTERN.test(search.updatedAfter)
      ? search.updatedAfter
      : undefined

  return {
    page: Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1,
    pageSize:
      Number.isFinite(pageSize) && pageSize >= 6 && pageSize <= 48 ? Math.floor(pageSize) : 12,
    folderId:
      typeof search.folderId === 'string' && search.folderId.trim()
        ? search.folderId.trim()
        : undefined,
    q: typeof search.q === 'string' && search.q.trim() ? search.q.trim() : undefined,
    kind: KINDS.includes(search.kind as FileKind) ? (search.kind as FileKind) : 'all',
    visibility: VISIBILITIES.includes(search.visibility as FileVisibilityFilter)
      ? (search.visibility as FileVisibilityFilter)
      : 'all',
    favorite: search.favorite === true || search.favorite === '1' || search.favorite === 'true',
    view: search.view === 'list' ? 'list' : 'grid',
    sort: SORTS.includes(search.sort as FileSort) ? (search.sort as FileSort) : 'updatedAt',
    order: search.order === 'asc' ? 'asc' : 'desc',
    updatedAfter,
  }
}
