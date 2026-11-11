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
})
