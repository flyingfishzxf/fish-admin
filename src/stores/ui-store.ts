import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { AppPath } from '@/config/nav'
import type { ShellContentWidth, ShellDensity, ShellLayout } from '@/config/shell'

/** One entry of the tab workbench: a reachable route plus the query it was left on. */
export interface ShellTab {
  to: AppPath
  search?: Record<string, unknown>
  pinned: boolean
}

interface UiState {
  commandOpen: boolean
  layout: ShellLayout
  density: ShellDensity
  contentWidth: ShellContentWidth
  tabs: ShellTab[]
  setCommandOpen: (open: boolean) => void
  toggleCommand: () => void
  setLayout: (layout: ShellLayout) => void
  setDensity: (density: ShellDensity) => void
  setContentWidth: (width: ShellContentWidth) => void
  openTab: (tab: ShellTab) => void
  closeTab: (to: AppPath) => void
  closeOtherTabs: (to: AppPath) => void
  closeTabsToRight: (to: AppPath) => void
  closeAllTabs: () => void
  toggleTabPin: (to: AppPath) => void
  keepOnlyTabs: (allowed: readonly AppPath[]) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      commandOpen: false,
      layout: 'sidebar',
      density: 'default',
      contentWidth: 'contained',
      tabs: [],
      setCommandOpen: (commandOpen) => set({ commandOpen }),
      toggleCommand: () => set((state) => ({ commandOpen: !state.commandOpen })),
      setLayout: (layout) => set({ layout }),
      setDensity: (density) => set({ density }),
      setContentWidth: (contentWidth) => set({ contentWidth }),
      openTab: (tab) =>
        set((state) => {
          const existing = state.tabs.find((entry) => entry.to === tab.to)
          if (existing) {
            return {
              tabs: state.tabs.map((entry) =>
                entry.to === tab.to ? { ...entry, search: tab.search } : entry,
              ),
            }
          }
          return { tabs: [...state.tabs, tab] }
        }),
      closeTab: (to) => set((state) => ({ tabs: state.tabs.filter((tab) => tab.to !== to) })),
      closeOtherTabs: (to) =>
        set((state) => ({ tabs: state.tabs.filter((tab) => tab.to === to || tab.pinned) })),
      closeTabsToRight: (to) =>
        set((state) => {
          const index = state.tabs.findIndex((tab) => tab.to === to)
          if (index < 0) return state
          return { tabs: state.tabs.slice(0, index + 1) }
        }),
      closeAllTabs: () => set((state) => ({ tabs: state.tabs.filter((tab) => tab.pinned) })),
      toggleTabPin: (to) =>
        set((state) => ({
          tabs: state.tabs.map((tab) => (tab.to === to ? { ...tab, pinned: !tab.pinned } : tab)),
        })),
      keepOnlyTabs: (allowed) =>
        set((state) => {
          const kept = state.tabs.filter((tab) => allowed.includes(tab.to))
          // Same list, same order: nothing to write, so no re-render loop.
          if (kept.length === state.tabs.length && kept.every((tab, i) => tab === state.tabs[i])) {
            return state
          }
          return { tabs: kept }
        }),
    }),
    {
      name: 'fish-admin:ui',
      version: 1,
      // The palette is transient: a reload must not reopen it.
      partialize: (state) => ({
        layout: state.layout,
        density: state.density,
        contentWidth: state.contentWidth,
        tabs: state.tabs,
      }),
    },
  ),
)
