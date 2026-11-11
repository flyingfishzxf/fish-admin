import { describe, expect, it } from 'vitest'
import { findNavItem, IMPLEMENTED_PATHS, NAV_GROUPS } from './nav'

describe('nav', () => {
  it('only exposes implemented paths', () => {
    const paths = NAV_GROUPS.flatMap((group) => group.items.map((item) => item.to))
    expect(paths.sort()).toEqual([...IMPLEMENTED_PATHS].sort())
  })

  it('finds the active item', () => {
    expect(findNavItem('/users')?.to).toBe('/users')
    expect(findNavItem('/')?.to).toBe('/')
    expect(findNavItem('/reports')).toBeUndefined()
  })
})
