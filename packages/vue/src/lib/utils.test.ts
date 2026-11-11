import { describe, expect, it } from 'vitest'

import { cn } from './utils'

describe('cn', () => {
  it('keeps the last conflicting Tailwind utility', () => {
    expect(cn('px-2 text-sm', 'px-4')).toBe('text-sm px-4')
  })

  it('drops falsey values', () => {
    expect(cn('flex', false, undefined, null, { hidden: false })).toBe('flex')
  })
})
