import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { UI_STORAGE_KEY } from '../config/shell'
import { useUiStore } from './ui'

function stored() {
  return JSON.parse(localStorage.getItem(UI_STORAGE_KEY) ?? '{}') as {
    state?: Record<string, unknown>
    version?: number
  }
}

describe('ui store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('starts on the sidebar layout with no tabs', () => {
    const store = useUiStore()
    expect(store.layout).toBe('sidebar')
    expect(store.density).toBe('default')
    expect(store.contentWidth).toBe('contained')
    expect(store.tabs).toEqual([])
    expect(store.collapsed).toBe(false)
  })

  it('persists layout, density, width and tabs but not transient chrome', () => {
    const store = useUiStore()
    store.setLayout('header')
    store.setDensity('compact')
    store.setContentWidth('wide')
    store.toggleCollapsed()
    store.setCommandOpen(true)

    expect(stored()).toEqual({
      state: { layout: 'header', density: 'compact', contentWidth: 'wide', tabs: [] },
      version: 1,
    })
  })

  it('reads the stored preferences back on the next boot', () => {
    localStorage.setItem(
      UI_STORAGE_KEY,
      JSON.stringify({
        state: {
          layout: 'mixed',
          density: 'compact',
          contentWidth: 'full',
          tabs: [{ to: '/users', pinned: true }],
        },
        version: 1,
      }),
    )
    const store = useUiStore()
    expect(store.layout).toBe('mixed')
    expect(store.density).toBe('compact')
    expect(store.contentWidth).toBe('full')
    expect(store.tabs).toEqual([{ to: '/users', pinned: true }])
  })

  it('refreshes the query of an existing tab without unpinning it', () => {
    const store = useUiStore()
    store.openTab({ to: '/users', search: { page: '1' }, pinned: true })
    store.openTab({ to: '/users', search: { page: '3' }, pinned: false })
    expect(store.tabs).toEqual([{ to: '/users', search: { page: '3' }, pinned: true }])
  })

  it('keeps pinned tabs when closing the others', () => {
    const store = useUiStore()
    store.openTab({ to: '/', pinned: true })
    store.openTab({ to: '/users', pinned: false })
    store.openTab({ to: '/roles', pinned: false })
    store.closeOtherTabs('/roles')
    expect(store.tabs.map((tab) => tab.to)).toEqual(['/', '/roles'])
  })

  it('closes everything to the right, pinned included', () => {
    const store = useUiStore()
    store.openTab({ to: '/', pinned: false })
    store.openTab({ to: '/users', pinned: false })
    store.openTab({ to: '/roles', pinned: true })
    store.closeTabsToRight('/users')
    expect(store.tabs.map((tab) => tab.to)).toEqual(['/', '/users'])
  })

  it('closes all but the pinned tabs', () => {
    const store = useUiStore()
    store.openTab({ to: '/', pinned: true })
    store.openTab({ to: '/users', pinned: false })
    store.closeAllTabs()
    expect(store.tabs.map((tab) => tab.to)).toEqual(['/'])
  })

  it('drops tabs the current role cannot reach', () => {
    const store = useUiStore()
    store.openTab({ to: '/', pinned: false })
    store.openTab({ to: '/roles', pinned: false })
    store.keepOnlyTabs(['/'])
    expect(store.tabs.map((tab) => tab.to)).toEqual(['/'])
  })

  it('leaves the workbench alone while the menu is still unknown', () => {
    const store = useUiStore()
    store.openTab({ to: '/users', pinned: false })
    store.keepOnlyTabs([])
    expect(store.tabs.map((tab) => tab.to)).toEqual(['/users'])
  })

  it('toggles a pin without touching the query', () => {
    const store = useUiStore()
    store.openTab({ to: '/users', search: { page: '2' }, pinned: false })
    store.toggleTabPin('/users')
    expect(store.tabs).toEqual([{ to: '/users', search: { page: '2' }, pinned: true }])
  })
})
