import { inject, provide, type InjectionKey } from 'vue'

export type SidebarState = 'expanded' | 'collapsed'

export interface SidebarContextValue {
  state: SidebarState
  open: boolean
  setOpen: (value: boolean) => void
  openMobile: boolean
  setOpenMobile: (value: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

export const SIDEBAR_KEY: InjectionKey<SidebarContextValue> = Symbol('fish-admin:sidebar')

export const SIDEBAR_WIDTH = '16rem'
export const SIDEBAR_WIDTH_MOBILE = '18rem'
export const SIDEBAR_WIDTH_ICON = '3rem'

export function provideSidebar(value: SidebarContextValue) {
  provide(SIDEBAR_KEY, value)
}

export function useSidebar() {
  const context = inject(SIDEBAR_KEY)
  if (!context) throw new Error('useSidebar must be used within a SidebarProvider')
  return context
}

/** Read a persisted sidebar state from the cookie, defaulting to `defaultOpen`. */
export function readSidebarCookie(defaultOpen: boolean): boolean {
  if (typeof document === 'undefined') return defaultOpen
  const match = document.cookie.match(/(?:^|;\s*)sidebar_state=([^;]+)/)
  return match ? match[1] === 'true' : defaultOpen
}

export function writeSidebarCookie(open: boolean) {
  if (typeof document === 'undefined') return
  document.cookie = `sidebar_state=${open}; path=/; max-age=${60 * 60 * 24 * 7}`
}
