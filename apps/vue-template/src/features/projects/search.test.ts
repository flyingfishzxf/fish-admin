import { describe, expect, it } from 'vitest'

import { DEFAULT_PROJECTS_SEARCH, validateProjectsSearch } from './search'

describe('validateProjectsSearch', () => {
  it('fills in the defaults for an empty query', () => {
    expect(validateProjectsSearch({})).toEqual(DEFAULT_PROJECTS_SEARCH)
  })

  it('clamps the page and the page size to the supported window', () => {
    expect(validateProjectsSearch({ page: '0', pageSize: '99' })).toMatchObject({
      page: 1,
      pageSize: 6,
    })
    expect(validateProjectsSearch({ page: '4', pageSize: '24' })).toMatchObject({
      page: 4,
      pageSize: 24,
    })
    expect(validateProjectsSearch({ pageSize: '2' }).pageSize).toBe(6)
  })

  it('accepts only known statuses, priorities and sort keys', () => {
    expect(validateProjectsSearch({ status: 'archived' }).status).toBeUndefined()
    expect(validateProjectsSearch({ status: 'review' }).status).toBe('review')
    expect(validateProjectsSearch({ priority: 'urgent' }).priority).toBeUndefined()
    expect(validateProjectsSearch({ priority: 'high' }).priority).toBe('high')
    expect(validateProjectsSearch({ sort: 'owner' }).sort).toBe('updatedAt')
    expect(validateProjectsSearch({ sort: 'budget' }).sort).toBe('budget')
    expect(validateProjectsSearch({ order: 'up' }).order).toBe('desc')
  })

  it('normalises the view and the archived switch', () => {
    expect(validateProjectsSearch({ view: 'table' }).view).toBe('board')
    expect(validateProjectsSearch({ view: 'list' }).view).toBe('list')
    expect(validateProjectsSearch({ archived: 'true' }).archived).toBe(true)
    expect(validateProjectsSearch({ archived: '1' }).archived).toBe(true)
    expect(validateProjectsSearch({ archived: 'no' }).archived).toBe(false)
  })

  it('trims the text filters and drops blanks', () => {
    expect(validateProjectsSearch({ q: '  atlas ' }).q).toBe('atlas')
    expect(validateProjectsSearch({ q: '   ' }).q).toBeUndefined()
    expect(validateProjectsSearch({ ownerId: 'u1' }).ownerId).toBe('u1')
    expect(validateProjectsSearch({ departmentId: '' }).departmentId).toBeUndefined()
  })
})
