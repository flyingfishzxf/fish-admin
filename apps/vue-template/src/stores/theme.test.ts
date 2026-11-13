import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { STORAGE_KEY } from '../config/theme'
import { useThemeStore } from './theme'

describe('theme store', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
    setActivePinia(createPinia())
  })

  it('reads the React-compatible stored shape', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { mode: 'dark', accent: 'cyan' }, version: 1 }),
    )
    const store = useThemeStore()
    expect(store.mode).toBe('dark')
    expect(store.resolvedMode).toBe('dark')
  })

  it('persists mode with the zustand-compatible envelope', () => {
    const store = useThemeStore()
    store.setMode('dark')
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toEqual({
      state: { mode: 'dark', accent: 'violet' },
      version: 1,
    })
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('tracks the system preference until disposed', () => {
    let listener: ((event: MediaQueryListEvent) => void) | undefined
    const remove = vi.fn()
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addEventListener: (_: string, next: (event: MediaQueryListEvent) => void) => {
          listener = next
        },
        removeEventListener: remove,
      })),
    )

    const store = useThemeStore()
    store.init()
    listener?.({ matches: true } as MediaQueryListEvent)
    expect(store.resolvedMode).toBe('dark')
    store.dispose()
    expect(remove).toHaveBeenCalled()
  })

  it('restores a stored accent and paints it on the root element', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { mode: 'light', accent: 'emerald' }, version: 1 }),
    )
    const store = useThemeStore()
    store.init()

    expect(store.accent).toBe('emerald')
    expect(document.documentElement.dataset.accent).toBe('emerald')
    store.dispose()
  })

  it('persists a new accent and applies it immediately', () => {
    const store = useThemeStore()
    store.setAccent('rose')

    expect(store.accent).toBe('rose')
    expect(document.documentElement.dataset.accent).toBe('rose')
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).toEqual({
      state: { mode: 'system', accent: 'rose' },
      version: 1,
    })
  })

  it('falls back to violet for sessions stored before the palettes existed', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { mode: 'dark' }, version: 1 }))
    const store = useThemeStore()

    expect(store.mode).toBe('dark')
    expect(store.accent).toBe('violet')
  })

  it('ignores an accent this build does not ship', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { mode: 'light', accent: 'purple' }, version: 1 }),
    )
    const store = useThemeStore()

    expect(store.accent).toBe('violet')
  })
})
