import { defineStore } from 'pinia'
import { ref } from 'vue'

import {
  readStoredUi,
  UI_STORAGE_KEY,
  type ShellContentWidth,
  type ShellDensity,
  type ShellLayout,
  type ShellTab,
} from '../config/shell'

export const useUiStore = defineStore('ui', () => {
  const stored = readStoredUi()
  const layout = ref<ShellLayout>(stored.layout)
  const density = ref<ShellDensity>(stored.density)
  const contentWidth = ref<ShellContentWidth>(stored.contentWidth)
  const tabs = ref<ShellTab[]>(stored.tabs)
  // Transient chrome state: never persisted, so a reload cannot reopen a drawer,
  // restore a collapse the user just toggled, or leave the palette on screen.
  const collapsed = ref(false)
  const mobileOpen = ref(false)
  const commandOpen = ref(false)

  function persist() {
    localStorage.setItem(
      UI_STORAGE_KEY,
      JSON.stringify({
        state: {
          layout: layout.value,
          density: density.value,
          contentWidth: contentWidth.value,
          tabs: tabs.value,
        },
        version: 1,
      }),
    )
  }

  function setLayout(next: ShellLayout) {
    layout.value = next
    persist()
  }

  function setDensity(next: ShellDensity) {
    density.value = next
    persist()
  }

  function setContentWidth(next: ShellContentWidth) {
    contentWidth.value = next
    persist()
  }

  function toggleCollapsed() {
    collapsed.value = !collapsed.value
  }

  function setCollapsed(next: boolean) {
    collapsed.value = next
  }

  function openMobile() {
    mobileOpen.value = true
  }

  function closeMobile() {
    mobileOpen.value = false
  }

  function setCommandOpen(open: boolean) {
    commandOpen.value = open
  }

  function toggleCommand() {
    commandOpen.value = !commandOpen.value
  }

  function openTab(tab: ShellTab) {
    const existing = tabs.value.find((entry) => entry.to === tab.to)
    if (existing) {
      // Re-opening an existing tab only refreshes its query; the pin survives.
      tabs.value = tabs.value.map((entry) =>
        entry.to === tab.to ? { ...entry, search: tab.search } : entry,
      )
    } else {
      tabs.value = [...tabs.value, tab]
    }
    persist()
  }

  function closeTab(to: string) {
    tabs.value = tabs.value.filter((tab) => tab.to !== to)
    persist()
  }

  function closeOtherTabs(to: string) {
    tabs.value = tabs.value.filter((tab) => tab.to === to || tab.pinned)
    persist()
  }

  function closeTabsToRight(to: string) {
    const index = tabs.value.findIndex((tab) => tab.to === to)
    if (index < 0) return
    // A positional slice on purpose: the React template also closes pinned tabs
    // that sit to the right, and the two templates must agree.
    tabs.value = tabs.value.slice(0, index + 1)
    persist()
  }

  function closeAllTabs() {
    tabs.value = tabs.value.filter((tab) => tab.pinned)
    persist()
  }

  function toggleTabPin(to: string) {
    tabs.value = tabs.value.map((tab) => (tab.to === to ? { ...tab, pinned: !tab.pinned } : tab))
    persist()
  }

  function keepOnlyTabs(allowed: readonly string[]) {
    // An empty allow-list means the menu has not resolved yet; clearing here
    // would wipe the workbench on every cold start.
    if (allowed.length === 0) return
    const kept = tabs.value.filter((tab) => allowed.includes(tab.to))
    if (kept.length === tabs.value.length && kept.every((tab, index) => tab === tabs.value[index]))
      return
    tabs.value = kept
    persist()
  }

  return {
    layout,
    density,
    contentWidth,
    tabs,
    collapsed,
    mobileOpen,
    commandOpen,
    setLayout,
    setDensity,
    setContentWidth,
    toggleCollapsed,
    setCollapsed,
    openMobile,
    closeMobile,
    setCommandOpen,
    toggleCommand,
    openTab,
    closeTab,
    closeOtherTabs,
    closeTabsToRight,
    closeAllTabs,
    toggleTabPin,
    keepOnlyTabs,
  }
})
