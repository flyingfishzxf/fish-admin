import { describe, expect, it } from 'vitest'

import { analyzePassword } from '@/features/auth/password'

describe('analyzePassword', () => {
  it('scores an empty password at zero', () => {
    expect(analyzePassword('')).toEqual({
      score: 0,
      checks: {
        length: false,
        lowercase: false,
        uppercase: false,
        number: false,
        symbol: false,
      },
    })
  })

  it('needs two passed checks before leaving zero', () => {
    expect(analyzePassword('ab').score).toBe(0)
    expect(analyzePassword('aB').score).toBe(1)
  })

  it('rewards length, case, digits and symbols step by step', () => {
    expect(analyzePassword('abcdefgh').score).toBe(1)
    expect(analyzePassword('Abcdefgh').score).toBe(2)
    expect(analyzePassword('Abcdefg1').score).toBe(3)
    expect(analyzePassword('Abcdefg1!').score).toBe(3)
  })

  it('only reaches four with five checks and ten characters', () => {
    expect(analyzePassword('Ab1!').score).toBe(3)
    expect(analyzePassword('Abcdefg1!').score).toBe(3)
    expect(analyzePassword('Abcdefgh1!').score).toBe(4)
  })
})
