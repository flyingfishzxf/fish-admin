import { describe, expect, it } from 'vitest'

import { DEMOS } from '../src/data/demos'

describe('demo registry', () => {
  it('keeps every demo well formed', () => {
    for (const demo of DEMOS) {
      expect(demo.id.startsWith(`${demo.componentId}/`)).toBe(true)
      expect(demo.title.en.length).toBeGreaterThan(0)
      expect(demo.title.zh.length).toBeGreaterThan(0)
      expect(demo.lines).toBeGreaterThan(0)
      expect(demo.filename.endsWith('.tsx')).toBe(true)
      expect(demo.source).toContain('export default')
      expect(demo.view).toBeTruthy()
    }
  })

  it('keeps demo ids unique', () => {
    const ids = DEMOS.map((demo) => demo.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
