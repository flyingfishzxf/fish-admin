import type { TFunction } from 'i18next'
import { describe, expect, it } from 'vitest'

import { createUserSchema } from '@/features/users/schemas'

const t = ((key: string) => key) as unknown as TFunction

const schema = createUserSchema(t)

function messages(input: unknown) {
  const result = schema.safeParse(input)
  return result.success ? [] : result.error.issues.map((issue) => issue.message)
}

describe('createUserSchema', () => {
  const valid = {
    name: 'Ada Lovelace',
    email: 'ada@fish.dev',
    roleId: 'role_admin',
    status: 'active',
    department: 'Engineering',
  }

  it('accepts valid input and trims text fields', () => {
    const result = schema.safeParse({
      ...valid,
      name: '  Ada Lovelace  ',
      email: '  ada@fish.dev  ',
      department: '  Engineering  ',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Ada Lovelace')
      expect(result.data.email).toBe('ada@fish.dev')
      expect(result.data.department).toBe('Engineering')
    }
  })

  it('requires a name of at least two characters', () => {
    expect(messages({ ...valid, name: '' })).toContain('validation:required')
    expect(messages({ ...valid, name: ' A ' })).toContain('validation:minLength')
  })

  it('rejects names longer than 60 characters', () => {
    expect(messages({ ...valid, name: 'a'.repeat(61) })).toContain('validation:maxLength')
  })

  it('validates the email format', () => {
    expect(messages({ ...valid, email: 'not-an-email' })).toContain('validation:email')
    expect(messages({ ...valid, email: '' })).toContain('validation:required')
  })

  it('requires a role and a department', () => {
    expect(messages({ ...valid, roleId: '' })).toContain('validation:required')
    expect(messages({ ...valid, department: '' })).toContain('validation:required')
  })

  it('rejects unknown statuses', () => {
    const result = schema.safeParse({ ...valid, status: 'deleted' })

    expect(result.success).toBe(false)
  })
})
