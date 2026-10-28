import { beforeEach, describe, expect, it } from 'vitest'

import { useUiStore } from '@/stores/ui-store'

describe('ui store', () => {
  beforeEach(() => {
    localStorage.clear()
    useUiStore.setState({
      commandOpen: false,
      layout: 'sidebar',
      density: 'default',
      contentWidth: 'contained',
      tabs: [],
    })
    useUiStore.persist.clearStorage()
  })

  it('defaults to the sidebar shell', () => {
    const state = useUiStore.getState()
    expect(state).toMatchObject({
      layout: 'sidebar',
      density: 'default',
      contentWidth: 'contained',
    })
  })

  it('persists shell preferences under the app storage prefix', () => {
    useUiStore.getState().setLayout('header')
    useUiStore.getState().setDensity('compact')
    useUiStore.getState().setContentWidth('wide')

    const stored = JSON.parse(localStorage.getItem('fish-admin:ui') ?? '{}')
    expect(stored.state).toMatchObject({
      layout: 'header',
      density: 'compact',
      contentWidth: 'wide',
    })
  })

  it('keeps the command palette out of storage so a reload cannot reopen it', () => {
    useUiStore.getState().setCommandOpen(true)
    const stored = JSON.parse(localStorage.getItem('fish-admin:ui') ?? '{}')
    expect(stored.state.commandOpen).toBeUndefined()
  })

  it('rehydrates a stored preference', () => {
    localStorage.setItem(
      'fish-admin:ui',
      JSON.stringify({ state: { layout: 'mixed' }, version: 1 }),
    )
    useUiStore.persist.rehydrate()
    expect(useUiStore.getState().layout).toBe('mixed')
  })

  it('records a tab once and refreshes the query it was left on', () => {
    const { openTab } = useUiStore.getState()
    openTab({ to: '/users', search: { page: 1 }, pinned: false })
    openTab({ to: '/roles', search: {}, pinned: false })
    openTab({ to: '/users', search: { page: 3 }, pinned: false })

    expect(useUiStore.getState().tabs).toEqual([
      { to: '/users', search: { page: 3 }, pinned: false },
      { to: '/roles', search: {}, pinned: false },
    ])
  })

  it('closing tabs to the right keeps every earlier tab, not only pinned ones', () => {
    const state = useUiStore.getState()
    state.openTab({ to: '/', search: {}, pinned: false })
    state.openTab({ to: '/users', search: {}, pinned: false })
    state.openTab({ to: '/roles', search: {}, pinned: false })
    state.openTab({ to: '/audit-logs', search: {}, pinned: false })

    state.closeTabsToRight('/roles')
    expect(useUiStore.getState().tabs.map((tab) => tab.to)).toEqual(['/', '/users', '/roles'])
  })

  it('close-all and close-others respect pinned tabs', () => {
    const state = useUiStore.getState()
    state.openTab({ to: '/', search: {}, pinned: true })
    state.openTab({ to: '/users', search: {}, pinned: false })
    state.openTab({ to: '/roles', search: {}, pinned: false })

    state.closeOtherTabs('/roles')
    expect(useUiStore.getState().tabs.map((tab) => tab.to)).toEqual(['/', '/roles'])

    state.closeAllTabs()
    expect(useUiStore.getState().tabs.map((tab) => tab.to)).toEqual(['/'])
  })

  it('prunes tabs outside the server menu without churning on a no-op', () => {
    const state = useUiStore.getState()
    state.openTab({ to: '/', search: {}, pinned: false })
    state.openTab({ to: '/reports', search: {}, pinned: false })

    const before = useUiStore.getState().tabs
    state.keepOnlyTabs(['/', '/reports'])
    expect(useUiStore.getState().tabs).toBe(before)

    useUiStore.getState().keepOnlyTabs(['/'])
    expect(useUiStore.getState().tabs.map((tab) => tab.to)).toEqual(['/'])
  })
})
