import { describe, expect, it } from 'vitest'

import {
  contentWidthClass,
  isContentWidth,
  isShellDensity,
  isShellLayout,
  readStoredUi,
  SHELL_CONTENT_WIDTH_OPTIONS,
  SHELL_DENSITY_OPTIONS,
  SHELL_LAYOUT_OPTIONS,
  UI_STORAGE_KEY,
} from './shell'

function storageWith(value: string) {
  return { getItem: (key: string) => (key === UI_STORAGE_KEY ? value : null) }
}

describe('shell config', () => {
  it('maps each content width to its max-width class', () => {
    expect(contentWidthClass('contained')).toBe('max-w-7xl')
    expect(contentWidthClass('wide')).toBe('max-w-[1600px]')
    expect(contentWidthClass('full')).toBe('max-w-none')
  })

  it('guards the three enums against unknown values', () => {
    expect(isShellLayout('mixed')).toBe(true)
    expect(isShellLayout('top')).toBe(false)
    expect(isShellDensity('compact')).toBe(true)
    expect(isShellDensity('comfortable')).toBe(false)
    expect(isContentWidth('full')).toBe(true)
    expect(isContentWidth('narrow')).toBe(false)
  })

  it('exposes one option per value with settings keys', () => {
    expect(SHELL_LAYOUT_OPTIONS).toHaveLength(3)
    expect(SHELL_DENSITY_OPTIONS).toHaveLength(2)
    expect(SHELL_CONTENT_WIDTH_OPTIONS).toHaveLength(3)
    for (const option of [
      ...SHELL_LAYOUT_OPTIONS,
      ...SHELL_DENSITY_OPTIONS,
      ...SHELL_CONTENT_WIDTH_OPTIONS,
    ]) {
      expect(option.labelKey.startsWith('settings:shell.')).toBe(true)
      expect(option.descriptionKey.startsWith('settings:shell.')).toBe(true)
    }
  })

  describe('readStoredUi', () => {
    it('falls back to the defaults without stored data', () => {
      expect(readStoredUi({ getItem: () => null })).toEqual({
        layout: 'sidebar',
        density: 'default',
        contentWidth: 'contained',
        tabs: [],
      })
    })

    it('keeps the valid fields and falls back per field', () => {
      const stored = readStoredUi(
        storageWith(
          JSON.stringify({
            state: { layout: 'header', density: 'comfortable', contentWidth: 3 },
            version: 1,
          }),
        ),
      )
      expect(stored.layout).toBe('header')
      expect(stored.density).toBe('default')
      expect(stored.contentWidth).toBe('contained')
    })

    it('drops malformed tab entries instead of throwing', () => {
      const stored = readStoredUi(
        storageWith(
          JSON.stringify({
            state: {
              tabs: [
                { to: '/users', pinned: true },
                { to: 7, pinned: false },
                { pinned: true },
                'nope',
                { to: '/users', pinned: false },
                { to: '/roles', search: { page: '2', empty: '' }, pinned: false },
              ],
            },
          }),
        ),
      )
      expect(stored.tabs).toEqual([
        { to: '/users', pinned: true },
        { to: '/roles', search: { page: '2' }, pinned: false },
      ])
    })

    it('treats unparseable JSON as empty', () => {
      expect(readStoredUi(storageWith('{oops')).tabs).toEqual([])
    })
  })
})
