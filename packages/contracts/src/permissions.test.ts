import { describe, expect, it } from 'vitest'

import { hasPermission, PERMISSION_CODES } from './permissions'

describe('hasPermission', () => {
  it('allows an unguarded action', () => {
    expect(hasPermission([], undefined)).toBe(true)
  })

  it('denies an empty session', () => {
    expect(hasPermission([], PERMISSION_CODES.userRead)).toBe(false)
    expect(hasPermission(null, PERMISSION_CODES.userRead)).toBe(false)
  })

  it('honours wildcards at both levels', () => {
    expect(hasPermission(['*'], PERMISSION_CODES.userDelete)).toBe(true)
    expect(hasPermission(['user:*'], PERMISSION_CODES.userDelete)).toBe(true)
    expect(hasPermission(['role:*'], PERMISSION_CODES.userDelete)).toBe(false)
  })
})
