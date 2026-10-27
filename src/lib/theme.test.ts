import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { applyTheme, useResolvedTheme } from '@/lib/theme'
import { useThemeStore } from '@/stores/theme-store'

function mockPrefersDark(matches: boolean) {
  vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

describe('applyTheme', () => {
  beforeEach(() => {
    const meta = document.createElement('meta')
    meta.name = 'theme-color'
    meta.content = '#ffffff'
    document.head.append(meta)
    document.documentElement.className = ''
    document.documentElement.removeAttribute('data-accent')
  })

  afterEach(() => {
    document.querySelector('meta[name="theme-color"]')?.remove()
  })

  it('applies dark mode and the accent', () => {
    mockPrefersDark(false)
    applyTheme('dark', 'emerald')

    const root = document.documentElement
    expect(root.classList.contains('dark')).toBe(true)
    expect(root.dataset.accent).toBe('emerald')
    expect(root.style.colorScheme).toBe('dark')
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe(
      '#191820',
    )
  })

  it('removes dark mode in light mode', () => {
    document.documentElement.classList.add('dark')
    mockPrefersDark(true)
    applyTheme('light', 'cyan')

    const root = document.documentElement
    expect(root.classList.contains('dark')).toBe(false)
    expect(root.dataset.accent).toBe('cyan')
    expect(root.style.colorScheme).toBe('light')
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe(
      '#fcfbfd',
    )
  })

  it('follows the system preference in system mode', () => {
    mockPrefersDark(true)
    applyTheme('system', 'violet')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    mockPrefersDark(false)
    applyTheme('system', 'violet')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})

describe('useResolvedTheme', () => {
  afterEach(() => {
    useThemeStore.setState({ mode: 'system' })
  })

  it('returns an explicit mode as-is', () => {
    useThemeStore.setState({ mode: 'dark' })
    const { result } = renderHook(() => useResolvedTheme())
    expect(result.current).toBe('dark')
  })

  it('resolves system mode from the media query', () => {
    mockPrefersDark(true)
    useThemeStore.setState({ mode: 'system' })
    const { result } = renderHook(() => useResolvedTheme())
    expect(result.current).toBe('dark')
  })
})
