import { describe, expect, it } from 'vitest'

import { DEFAULT_PROJECTS_SEARCH, validateProjectsSearch } from './search'

describe('projects search', () => {
  it('falls back to defaults', () => {
    expect(validateProjectsSearch({})).toEqual(DEFAULT_PROJECTS_SEARCH)
  })

  it('clamps paging values', () => {
    expect(validateProjectsSearch({ page: '-1', pageSize: '2' })).toMatchObject({
      page: 1,
      pageSize: 6,
    })
    expect(validateProjectsSearch({ page: '4.9', pageSize: '12' })).toMatchObject({
      page: 4,
      pageSize: 12,
    })
    expect(validateProjectsSearch({ pageSize: '500' }).pageSize).toBe(6)
  })

  it('keeps valid filters and trims the query', () => {
    expect(
      validateProjectsSearch({
        q: '  atlas  ',
        status: 'active',
        priority: 'high',
        ownerId: 'user-ada',
        departmentId: 'dept-engineering',
        view: 'list',
        archived: '1',
        sort: 'budget',
        order: 'asc',
      }),
    ).toEqual({
      page: 1,
      pageSize: 6,
      q: 'atlas',
      status: 'active',
      priority: 'high',
      ownerId: 'user-ada',
      departmentId: 'dept-engineering',
      view: 'list',
      archived: true,
      sort: 'budget',
      order: 'asc',
    })
  })

  it('drops unknown enums and empty strings', () => {
    expect(
      validateProjectsSearch({
        q: '   ',
        status: 'paused',
        priority: 'urgent',
        ownerId: '',
        departmentId: '',
        view: 'gantt',
        sort: 'ceiling',
        order: 'descending',
      }),
    ).toEqual({ ...DEFAULT_PROJECTS_SEARCH, archived: false })
  })

  it('treats boolean archived flags consistently', () => {
    expect(validateProjectsSearch({ archived: true }).archived).toBe(true)
    expect(validateProjectsSearch({ archived: 'true' }).archived).toBe(true)
    expect(validateProjectsSearch({ archived: 'false' }).archived).toBe(false)
  })
})
