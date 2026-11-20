import { describe, expect, it } from 'vitest'

import { DEMOS } from '../src/data/demos'
import { COMPONENTS } from '../src/data/registry'

describe('demo registry', () => {
  it('keeps every demo well formed', () => {
    for (const demo of DEMOS) {
      expect(demo.id.startsWith(`${demo.componentId}/`)).toBe(true)
      expect(demo.title.en.length).toBeGreaterThan(0)
      expect(demo.title.zh.length).toBeGreaterThan(0)
      expect(demo.lines).toBeGreaterThan(0)
      expect(demo.source).toContain('<template')
      expect(demo.view).toBeTruthy()
      if (demo.filename.endsWith('.tsx')) {
        // Mirrored demos keep the frozen React source line count.
        expect(demo.source).toContain('export default')
      } else {
        // Vue-native demos point at their own SFC in this app.
        expect(demo.filename).toContain('apps/parity-vue/src/demos/')
      }
    }
  })

  it('keeps demo ids unique', () => {
    const ids = DEMOS.map((demo) => demo.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('only registers demos for known components', () => {
    const known = new Set(COMPONENTS.map((entry) => entry.id))
    for (const demo of DEMOS) {
      expect(known.has(demo.componentId)).toBe(true)
    }
  })
})
