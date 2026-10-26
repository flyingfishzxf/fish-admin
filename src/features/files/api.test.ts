import { beforeEach, describe, expect, it, vi } from 'vitest'

const { apiRequestMock } = vi.hoisted(() => ({ apiRequestMock: vi.fn() }))

vi.mock('@/lib/api-client', () => ({ apiRequest: apiRequestMock }))

import {
  deleteFile,
  deleteFiles,
  fetchFileFolders,
  fetchFiles,
  updateFile,
  uploadFile,
} from './api'

describe('files API client', () => {
  const signal = new AbortController().signal

  beforeEach(() => {
    apiRequestMock.mockReset()
    apiRequestMock.mockResolvedValue(undefined)
  })

  it('loads folders', () => {
    fetchFileFolders(signal)

    expect(apiRequestMock).toHaveBeenCalledWith('/file-folders', { signal })
  })

  it('serializes the file list query', () => {
    fetchFiles(
      {
        page: 2,
        pageSize: 24,
        folderId: 'folder-design',
        q: 'logo',
        kind: 'image',
        visibility: 'team',
        favorite: true,
        sort: 'size',
        order: 'asc',
        updatedAfter: '2026-10-01',
      },
      signal,
    )

    expect(apiRequestMock).toHaveBeenCalledWith(
      '/files?page=2&pageSize=24&folderId=folder-design&q=logo&kind=image&visibility=team&favorite=1&sort=size&order=asc&updatedAfter=2026-10-01',
      { signal },
    )
  })

  it('omits the default file kind and optional filters', () => {
    fetchFiles({ page: 1, pageSize: 12, kind: 'all' }, signal)

    expect(apiRequestMock).toHaveBeenCalledWith('/files?page=1&pageSize=12', { signal })
  })

  it('uploads a file with metadata and an optional preview', () => {
    uploadFile({
      name: 'logo.svg',
      mime: 'image/svg+xml',
      size: 2048,
      folderId: 'folder-design-brand',
      visibility: 'team',
      dataUrl: 'data:image/svg+xml;base64,PHN2Zy8+',
    })

    expect(apiRequestMock).toHaveBeenCalledWith('/files', {
      method: 'POST',
      body: {
        name: 'logo.svg',
        mime: 'image/svg+xml',
        size: 2048,
        folderId: 'folder-design-brand',
        visibility: 'team',
        dataUrl: 'data:image/svg+xml;base64,PHN2Zy8+',
      },
      timeoutMs: 60_000,
    })
  })

  it('updates, deletes and bulk deletes files', () => {
    updateFile('file/1', { name: 'renamed.svg', favorite: true })
    deleteFile('file/1')
    deleteFiles(['file-1', 'file-2'])

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, '/files/file%2F1', {
      method: 'PATCH',
      body: { name: 'renamed.svg', favorite: true },
    })
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, '/files/file%2F1', { method: 'DELETE' })
    expect(apiRequestMock).toHaveBeenNthCalledWith(3, '/files/bulk-delete', {
      method: 'POST',
      body: { ids: ['file-1', 'file-2'] },
    })
  })
})
