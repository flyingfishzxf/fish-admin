import type { TFunction } from 'i18next'
import type { ZodType } from 'zod'
import { describe, expect, it } from 'vitest'

import {
  createAcceptInviteSchema,
  createChangePasswordSchema,
  createForgotPasswordSchema,
  createLoginSchema,
  createRegisterSchema,
  createResetPasswordSchema,
} from '@/features/auth/schemas'

const t = ((key: string) => key) as unknown as TFunction

function issues(schema: ZodType, input: unknown) {
  const result = schema.safeParse(input)
  return result.success
    ? []
    : result.error.issues.map((issue) => `${issue.path.join('.')}:${issue.message}`)
}

describe('createLoginSchema', () => {
  const schema = createLoginSchema(t)

  it('accepts an email with any non-empty password', () => {
    expect(schema.safeParse({ email: 'admin@fish.dev', password: 'x' }).success).toBe(true)
  })

  it('does not enforce password composition on sign-in', () => {
    expect(issues(schema, { email: 'admin@fish.dev', password: 'short' })).toEqual([])
  })

  it('requires both fields', () => {
    expect(issues(schema, { email: '', password: '' })).toEqual([
      'email:validation:required',
      'email:validation:email',
      'password:validation:required',
    ])
  })
})

describe('createRegisterSchema', () => {
  const schema = createRegisterSchema(t)
  const valid = {
    name: 'Ada Lovelace',
    email: 'ada@fish.dev',
    password: 'Passw0rd!',
    confirmPassword: 'Passw0rd!',
  }

  it('accepts a complete registration', () => {
    expect(schema.safeParse(valid).success).toBe(true)
  })

  it('enforces the password policy', () => {
    expect(issues(schema, { ...valid, password: 'abcdefgh', confirmPassword: 'abcdefgh' })).toEqual(
      ['password:validation:passwordNumber'],
    )
    expect(issues(schema, { ...valid, password: '12345678', confirmPassword: '12345678' })).toEqual(
      ['password:validation:passwordLetter'],
    )
    expect(issues(schema, { ...valid, password: 'Ab1', confirmPassword: 'Ab1' })).toEqual([
      'password:validation:minLength',
    ])
  })

  it('reports a mismatch on the confirm field', () => {
    expect(issues(schema, { ...valid, confirmPassword: 'Other0rd!' })).toEqual([
      'confirmPassword:validation:passwordMismatch',
    ])
  })

  it('requires a name of at least two characters and a valid email', () => {
    expect(issues(schema, { ...valid, name: 'A' })).toEqual(['name:validation:minLength'])
    expect(issues(schema, { ...valid, email: 'ada' })).toEqual(['email:validation:email'])
  })
})

describe('createForgotPasswordSchema', () => {
  it('only needs a valid email', () => {
    const schema = createForgotPasswordSchema(t)
    expect(schema.safeParse({ email: 'ada@fish.dev' }).success).toBe(true)
    expect(issues(schema, { email: 'nope' })).toEqual(['email:validation:email'])
  })
})

describe('createResetPasswordSchema', () => {
  const schema = createResetPasswordSchema(t)

  it('requires two matching strong passwords', () => {
    expect(schema.safeParse({ password: 'Passw0rd!', confirmPassword: 'Passw0rd!' }).success).toBe(
      true,
    )
    expect(issues(schema, { password: 'Passw0rd!', confirmPassword: 'Passw0rd?' })).toEqual([
      'confirmPassword:validation:passwordMismatch',
    ])
  })
})

describe('createAcceptInviteSchema', () => {
  const schema = createAcceptInviteSchema(t)

  it('needs a name and a matching password pair', () => {
    expect(
      issues(schema, { name: '', password: 'Passw0rd!', confirmPassword: 'Passw0rd!' }),
    ).toEqual(['name:validation:required', 'name:validation:minLength'])
    expect(
      issues(schema, { name: 'Ada', password: 'Passw0rd!', confirmPassword: 'Passw0rd' }),
    ).toEqual(['confirmPassword:validation:passwordMismatch'])
  })
})

describe('createChangePasswordSchema', () => {
  const schema = createChangePasswordSchema(t)

  it('requires the current password and a matching new one', () => {
    expect(
      issues(schema, {
        currentPassword: '',
        newPassword: 'Passw0rd!',
        confirmPassword: 'Passw0rd!',
      }),
    ).toEqual(['currentPassword:validation:required'])
    expect(
      issues(schema, {
        currentPassword: 'OldPass1!',
        newPassword: 'Passw0rd!',
        confirmPassword: 'Passw0rd?',
      }),
    ).toEqual(['confirmPassword:validation:passwordMismatch'])
  })

  it('applies the password policy to the new password only', () => {
    expect(
      issues(schema, {
        currentPassword: 'weak',
        newPassword: 'weak',
        confirmPassword: 'weak',
      }),
    ).toEqual(['newPassword:validation:minLength', 'newPassword:validation:passwordNumber'])
  })
})
