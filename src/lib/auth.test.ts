import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { requirePermission, requireSession, sanitizeRedirect } from '@/lib/auth'
import { useAuthStore } from '@/stores/auth-store'
import type { AuthUser } from '@/types'

const user: AuthUser = {
  id: 'usr_1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  roleId: 'admin',
  roleName: 'Admin',
  permissions: ['users:read'],
  emailVerified: true,
  twoFactorEnabled: false,
}

const context = { location: { href: '/users?page=2' } }

function thrownRedirect(run: () => void) {
  try {
    run()
  } catch (error) {
    return error as { options: { to?: string; search?: { redirect?: string }; replace?: boolean } }
  }
  throw new Error('expected a redirect to be thrown')
}

describe('auth guards', () => {
  beforeEach(() => {
    useAuthStore.setState({ user, status: 'authenticated' })
  })

  afterEach(() => {
    useAuthStore.setState({ user: null, status: 'idle' })
  })

  it('lets an authenticated session through', () => {
    expect(() => requireSession(context)).not.toThrow()
    expect(() => requirePermission('users:read')(context)).not.toThrow()
  })

  it('redirects anonymous sessions to login with the current location', () => {
    useAuthStore.setState({ user: null, status: 'anonymous' })

    expect(thrownRedirect(() => requireSession(context)).options).toMatchObject({
      to: '/login',
      search: { redirect: '/users?page=2' },
      replace: true,
    })
  })

  it('redirects a missing permission to the 403 screen', () => {
    const redirect = thrownRedirect(() => requirePermission('users:write')(context))

    expect(redirect.options).toMatchObject({ to: '/403', replace: true })
  })
})

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
