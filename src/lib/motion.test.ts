import { afterEach, describe, expect, it, vi } from 'vitest'

import { CHART_ANIMATION_EASING, prefersReducedMotion } from './motion'

describe('motion', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('reports the reduced-motion preference', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
    } as MediaQueryList)
    expect(prefersReducedMotion()).toBe(true)
  })

  it('uses the design system easing curve', () => {
    expect(CHART_ANIMATION_EASING).toBe('cubic-bezier(0.2, 0, 0, 1)')
  })
})
