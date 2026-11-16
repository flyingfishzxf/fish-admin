import { describe, expect, it } from 'vitest'

import { DEFAULT_FILES_SEARCH, validateFilesSearch } from './search'

describe('validateFilesSearch', () => {
  it('fills in the defaults for an empty query', () => {
    expect(validateFilesSearch({})).toEqual(DEFAULT_FILES_SEARCH)
  })

  it('clamps the page and the page size', () => {
    expect(validateFilesSearch({ page: '0', pageSize: '500' })).toMatchObject({
      page: 1,
      pageSize: 12,
    })
    expect(validateFilesSearch({ page: '3', pageSize: '48' })).toMatchObject({
      page: 3,
      pageSize: 48,
    })
    expect(validateFilesSearch({ page: '2.7' }).page).toBe(2)
  })

  it('accepts only the known enum values', () => {
    expect(validateFilesSearch({ kind: 'video' }).kind).toBe('all')
    expect(validateFilesSearch({ visibility: 'public' }).visibility).toBe('all')
    expect(validateFilesSearch({ sort: 'mime' }).sort).toBe('updatedAt')
    expect(validateFilesSearch({ order: 'sideways' }).order).toBe('desc')
    expect(validateFilesSearch({ view: 'kanban' }).view).toBe('grid')
  })

  it('keeps a well-formed day and drops anything else', () => {
    expect(validateFilesSearch({ updatedAfter: '2026-11-01' }).updatedAfter).toBe('2026-11-01')
    expect(validateFilesSearch({ updatedAfter: '01/11/2026' }).updatedAfter).toBeUndefined()
    expect(validateFilesSearch({ updatedAfter: '2026-13-01' }).updatedAfter).toBe('2026-13-01')
  })

  it('normalises the favorite flag from the three accepted spellings', () => {
    expect(validateFilesSearch({ favorite: true }).favorite).toBe(true)
    expect(validateFilesSearch({ favorite: '1' }).favorite).toBe(true)
    expect(validateFilesSearch({ favorite: 'true' }).favorite).toBe(true)
    expect(validateFilesSearch({ favorite: 'no' }).favorite).toBe(false)
  })

  it('trims the text filters and drops blanks', () => {
    expect(validateFilesSearch({ q: '  logo  ' }).q).toBe('logo')
    expect(validateFilesSearch({ q: '   ' }).q).toBeUndefined()
    expect(validateFilesSearch({ folderId: ' folder-design ' }).folderId).toBe('folder-design')
    expect(validateFilesSearch({ folderId: '' }).folderId).toBeUndefined()
  })
})
