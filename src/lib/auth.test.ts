import { describe, expect, it } from 'vitest'

import { sanitizeRedirect } from '@/lib/auth'

describe('sanitizeRedirect', () => {
  it('keeps internal paths', () => {
    expect(sanitizeRedirect('/users?page=2')).toBe('/users?page=2')
    expect(sanitizeRedirect('/')).toBe('/')
  })

  it('drops missing, external and protocol-relative values', () => {
    expect(sanitizeRedirect(undefined)).toBeUndefined()
    expect(sanitizeRedirect('')).toBeUndefined()
    expect(sanitizeRedirect('https://evil.example')).toBeUndefined()
    expect(sanitizeRedirect('//evil.example')).toBeUndefined()
  })

  it('avoids redirect loops back to the login page', () => {
    expect(sanitizeRedirect('/login')).toBeUndefined()
    expect(sanitizeRedirect('/login?redirect=/users')).toBeUndefined()
  })
})
