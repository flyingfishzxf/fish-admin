import { NAV_CONTRACT } from '@fish-admin/contracts/navigation'
import {
  BarChart3,
  Bell,
  BookMarked,
  Boxes,
  CircleDot,
  FolderKanban,
  FolderOpen,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  Network,
  Palette,
  Plug,
  ScrollText,
  Settings2,
  ShieldCheck,
  UserRound,
  Users,
  Workflow,
} from 'lucide-vue-next'
import type { Component } from 'vue'

export interface NavItem {
  titleKey: string
  to: string
  icon: Component
  permission?: string
}
export interface NavGroup {
  titleKey: string
  items: NavItem[]
}

const ICONS: Record<string, Component> = {
  'bar-chart-3': BarChart3,
  bell: Bell,
  'book-marked': BookMarked,
  boxes: Boxes,
  'circle-dot': CircleDot,
  'folder-kanban': FolderKanban,
  'folder-open': FolderOpen,
  'key-round': KeyRound,
  'layout-dashboard': LayoutDashboard,
  'lock-keyhole': LockKeyhole,
  network: Network,
  palette: Palette,
  plug: Plug,
  'scroll-text': ScrollText,
  'settings-2': Settings2,
  'shield-check': ShieldCheck,
  'user-round': UserRound,
  users: Users,
  workflow: Workflow,
}

// Every path in this set has a route with a matching `meta.permission`; a path
// the build cannot open must not appear in the sidebar. `nav.test.ts` compares
// the two so the set cannot drift from `router.ts`.
export const IMPLEMENTED_PATHS = new Set([
  '/',
  '/reports',
  '/notifications',
  '/users',
  '/files',
  '/departments',
  '/roles',
  '/permissions',
  '/dictionaries',
  '/audit-logs',
  '/integrations',
  '/profile',
  '/security',
  '/settings',
])

export const NAV_GROUPS: NavGroup[] = NAV_CONTRACT.map((group) => ({
  titleKey: group.titleKey,
  items: group.items
    .filter((item) => IMPLEMENTED_PATHS.has(item.to))
    .map((item) => ({
      titleKey: item.titleKey,
      to: item.to,
      icon: ICONS[item.icon] ?? CircleDot,
      ...(item.permission ? { permission: item.permission } : {}),
    })),
})).filter((group) => group.items.length > 0)

export function isPathActive(pathname: string, path: string) {
  if (path === '/') return pathname === '/'
  return pathname === path || pathname.startsWith(`${path}/`)
}

export function findNavItem(pathname: string, groups: NavGroup[] = NAV_GROUPS) {
  // Longest matching prefix wins: `/roles/matrix` resolves to Roles because no
  // deeper item exists, and a future `/roles/:id` entry would take precedence
  // instead of depending on the order of `NAV_CONTRACT`.
  let best: NavItem | undefined
  for (const group of groups) {
    for (const item of group.items) {
      if (!isPathActive(pathname, item.to)) continue
      if (!best || item.to.length > best.to.length) best = item
    }
  }
  return best
}

export function findNavGroup(pathname: string, groups: NavGroup[] = NAV_GROUPS) {
  const item = findNavItem(pathname, groups)
  return item ? groups.find((group) => group.items.includes(item)) : undefined
}
