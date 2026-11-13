import { describe, expect, it } from 'vitest'

import { analyzePassword } from './password'

// Mirrors the React template's `password.test.ts` boundaries.
describe('analyzePassword', () => {
  it.each([
    ['', 0],
    ['ab', 0],
    ['aB', 1],
    ['abcdefgh', 1],
    ['Abcdefgh', 2],
    ['Abcdefg1', 3],
    ['Abcdefg1!', 3],
    ['Ab1!', 3],
    ['Abcdefgh1!', 4],
  ])('scores %o as %i', (password, score) => {
    expect(analyzePassword(password).score).toBe(score)
  })

  it('reports each individual check', () => {
    expect(analyzePassword('Abcdefg1!').checks).toEqual({
      length: true,
      lowercase: true,
      uppercase: true,
      number: true,
      symbol: true,
    })
    expect(analyzePassword('abcdefgh').checks).toEqual({
      length: true,
      lowercase: true,
      uppercase: false,
      number: false,
      symbol: false,
    })
  })

  it('only reaches the top score with ten characters or more', () => {
    expect(analyzePassword('Abcdefg1!').score).toBe(3)
    expect(analyzePassword('Abcdefgh1!').score).toBe(4)
  })
})
