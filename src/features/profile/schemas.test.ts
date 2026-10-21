import type { TFunction } from 'i18next'
import { describe, expect, it } from 'vitest'

import { createProfileSchema } from '@/features/profile/schemas'

const t = ((key: string) => key) as unknown as TFunction

const schema = createProfileSchema(t)

function messages(input: unknown) {
  const result = schema.safeParse(input)
  return result.success ? [] : result.error.issues.map((issue) => issue.message)
}

describe('createProfileSchema', () => {
  it('accepts and trims a valid profile', () => {
    const result = schema.safeParse({ name: '  Ada  ', bio: '  Building things.  ' })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ name: 'Ada', bio: 'Building things.' })
    }
  })

  it('allows an empty bio', () => {
    expect(schema.safeParse({ name: 'Ada', bio: '' }).success).toBe(true)
  })

  it('requires a name', () => {
    expect(messages({ name: '', bio: '' })).toContain('validation:required')
    expect(messages({ name: 'A', bio: '' })).toContain('validation:minLength')
  })

  it('limits the name to 60 characters', () => {
    expect(messages({ name: 'a'.repeat(61), bio: '' })).toContain('validation:maxLength')
  })

  it('limits the bio to 280 characters', () => {
    expect(messages({ name: 'Ada', bio: 'a'.repeat(281) })).toContain('validation:maxLength')
  })
})
