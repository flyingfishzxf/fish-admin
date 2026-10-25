import { describe, expect, it } from 'vitest'

import { DEFAULT_FILES_SEARCH, validateFilesSearch } from './search'

describe('files search', () => {
  it('falls back to defaults', () => {
    expect(validateFilesSearch({})).toEqual(DEFAULT_FILES_SEARCH)
  })

  it('clamps paging values', () => {
    expect(validateFilesSearch({ page: '-3', pageSize: '2' })).toMatchObject({
      page: 1,
      pageSize: 12,
    })
    expect(validateFilesSearch({ page: '3.8', pageSize: '24' })).toMatchObject({
      page: 3,
      pageSize: 24,
    })
    expect(validateFilesSearch({ pageSize: '99' }).pageSize).toBe(12)
  })

  it('keeps valid filters and trims text input', () => {
    expect(
      validateFilesSearch({
        folderId: ' folder-design ',
        q: '  logo  ',
        kind: 'image',
        visibility: 'private',
        favorite: 'true',
        view: 'list',
        sort: 'size',
        order: 'asc',
        updatedAfter: '2026-10-01',
      }),
    ).toEqual({
      page: 1,
      pageSize: 12,
      folderId: 'folder-design',
      q: 'logo',
      kind: 'image',
      visibility: 'private',
      favorite: true,
      view: 'list',
      sort: 'size',
      order: 'asc',
      updatedAfter: '2026-10-01',
    })
  })

  it('drops unknown enums, blank strings and malformed dates', () => {
    expect(
      validateFilesSearch({
        folderId: '   ',
        q: '   ',
        kind: 'video',
        visibility: 'public',
        view: 'masonry',
        sort: 'colour',
        order: 'sideways',
        updatedAfter: '10/01/2026',
      }),
    ).toEqual(DEFAULT_FILES_SEARCH)
  })

  it('accepts boolean and numeric flag forms for favorites', () => {
    expect(validateFilesSearch({ favorite: true }).favorite).toBe(true)
    expect(validateFilesSearch({ favorite: '1' }).favorite).toBe(true)
    expect(validateFilesSearch({ favorite: 'false' }).favorite).toBe(false)
  })
})
