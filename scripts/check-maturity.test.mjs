import { describe, expect, it } from 'vitest'

import { evaluateComponent, summarize } from './maturity-core.mjs'

const base = {
  id: 'button',
  name: 'Button',
  category: 'primitive',
  status: 'stable',
  since: '0.1.0',
  usedIn: '/',
}

describe('maturity', () => {
  it('passes a stable component with every evidence slot filled', () => {
    const result = evaluateComponent({
      entry: base,
      hasTest: true,
      hasAxe: true,
      hasVisualLight: true,
      hasVisualDark: true,
      hasDemo: true,
      hasDocs: true,
    })
    expect(result.problems).toEqual([])
  })

  it('fails a stable component without a test file', () => {
    const result = evaluateComponent({
      entry: base,
      hasTest: false,
      hasAxe: true,
      hasVisualLight: true,
      hasVisualDark: true,
      hasDemo: true,
      hasDocs: true,
    })
    expect(result.problems).toContain('missing test')
  })

  it('allows beta components to miss evidence but records it', () => {
    const result = evaluateComponent({
      entry: { ...base, status: 'beta', statusReason: 'API may change' },
      hasTest: false,
      hasAxe: true,
      hasVisualLight: false,
      hasVisualDark: false,
      hasDemo: true,
      hasDocs: true,
    })
    expect(result.problems).toEqual([])
    expect(result.evidence.visual).toEqual({ light: false, dark: false })
  })

  it('fails a beta component without a written reason', () => {
    const result = evaluateComponent({
      entry: { ...base, status: 'beta' },
      hasTest: true,
      hasAxe: true,
      hasVisualLight: true,
      hasVisualDark: true,
      hasDemo: true,
      hasDocs: true,
    })
    expect(result.problems).toContain('missing status reason')
  })

  it('summarizes stable and beta counts', () => {
    const components = [
      {
        status: 'stable',
        evidence: { test: true, visual: { light: true, dark: true }, demo: true },
      },
      {
        status: 'beta',
        evidence: { test: false, visual: { light: false, dark: false }, demo: true },
      },
    ]
    expect(summarize(components)).toMatchObject({
      total: 2,
      stable: 1,
      beta: 1,
      missingTest: 1,
      missingVisual: 1,
    })
  })
})
