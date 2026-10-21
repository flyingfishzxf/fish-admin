import { describe, expect, it } from 'vitest'

import { cn, getInitials } from '@/lib/utils'

describe('cn', () => {
  it('merges conflicting Tailwind classes', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })

  it('supports conditional values', () => {
    const isHidden: boolean = false
    expect(cn('base', isHidden && 'hidden', ['extra'])).toBe('base extra')
  })
})

describe('getInitials', () => {
  it('uses up to two words', () => {
    expect(getInitials('Ada Lovelace')).toBe('AL')
    expect(getInitials('Ada King Lovelace')).toBe('AK')
  })

  it('handles single names and extra whitespace', () => {
    expect(getInitials('  Ada  ')).toBe('A')
  })

  it('returns an empty string for an empty name', () => {
    expect(getInitials('   ')).toBe('')
  })
})
