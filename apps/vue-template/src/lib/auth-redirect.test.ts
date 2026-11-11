import { describe, expect, it } from 'vitest'
import { sanitizeRedirect } from './auth-redirect'

describe('sanitizeRedirect', () => {
  it('keeps in-app paths', () => {
    expect(sanitizeRedirect('/users?page=2')).toBe('/users?page=2')
  })

  it.each([
    undefined,
    '',
    'https://evil.test',
    '//evil.test',
    '/\\evil.test',
    '/login',
    '/login?redirect=/users',
  ])('rejects %s', (value) => {
    expect(sanitizeRedirect(value)).toBeUndefined()
  })

  // Vue Router hands back `string | null | (string | null)[]` for a query
  // param, so a repeated `?redirect=/a&redirect=/b` arrives as an array.
  it.each([[['/users', '/admin']], [null], [42], [{ path: '/users' }]])(
    'rejects non-string %s',
    (value) => {
      expect(sanitizeRedirect(value)).toBeUndefined()
    },
  )
})
