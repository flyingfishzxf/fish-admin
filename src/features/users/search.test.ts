import { describe, expect, it } from 'vitest'

import { validateUsersSearch } from '@/features/users/search'

describe('validateUsersSearch', () => {
  it('applies defaults for an empty search', () => {
    expect(validateUsersSearch({})).toEqual({
      page: 1,
      pageSize: 10,
      q: undefined,
      roleId: undefined,
      status: undefined,
      sort: 'createdAt',
      order: 'desc',
    })
  })

  it('parses numbers from the URL', () => {
    const search = validateUsersSearch({ page: '3', pageSize: '25' })

    expect(search.page).toBe(3)
    expect(search.pageSize).toBe(25)
  })

  it('clamps invalid paging values', () => {
    expect(validateUsersSearch({ page: '0' }).page).toBe(1)
    expect(validateUsersSearch({ page: '-2' }).page).toBe(1)
    expect(validateUsersSearch({ page: 'abc' }).page).toBe(1)
    expect(validateUsersSearch({ pageSize: '2' }).pageSize).toBe(10)
    expect(validateUsersSearch({ pageSize: '500' }).pageSize).toBe(10)
  })

  it('floors fractional input', () => {
    expect(validateUsersSearch({ page: 2.9, pageSize: 12.7 })).toMatchObject({
      page: 2,
      pageSize: 12,
    })
  })

  it('trims and drops an empty query', () => {
    expect(validateUsersSearch({ q: '  Demo  ' }).q).toBe('Demo')
    expect(validateUsersSearch({ q: '   ' }).q).toBeUndefined()
    expect(validateUsersSearch({ q: 42 }).q).toBeUndefined()
  })

  it('accepts known sort keys and statuses', () => {
    expect(validateUsersSearch({ sort: 'name', order: 'asc' })).toMatchObject({
      sort: 'name',
      order: 'asc',
    })
    expect(validateUsersSearch({ status: 'invited' }).status).toBe('invited')
  })

  it('falls back to defaults for unknown sort keys and statuses', () => {
    expect(validateUsersSearch({ sort: 'password', order: 'sideways' })).toMatchObject({
      sort: 'createdAt',
      order: 'desc',
    })
    expect(validateUsersSearch({ status: 'deleted' }).status).toBeUndefined()
  })

  it('keeps a roleId filter and drops an empty one', () => {
    expect(validateUsersSearch({ roleId: 'role_admin' }).roleId).toBe('role_admin')
    expect(validateUsersSearch({ roleId: '' }).roleId).toBeUndefined()
  })

  it('enables the 5 000-row demo dataset only when asked', () => {
    expect(validateUsersSearch({ dataset: 'large' })).toMatchObject({
      dataset: 'large',
      pageSize: 5000,
    })
    expect(validateUsersSearch({ dataset: 'large', pageSize: '5000' }).pageSize).toBe(5000)
    expect(validateUsersSearch({ dataset: 'large', pageSize: '500' }).pageSize).toBe(5000)
    expect(validateUsersSearch({ dataset: 'huge' })).not.toHaveProperty('dataset')
  })
})
