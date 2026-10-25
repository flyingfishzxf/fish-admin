import {
  BarChart3,
  Bell,
  Boxes,
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
  type LucideIcon,
} from 'lucide-react'

import { PERMISSION_CODES, type PermissionCode } from '@/config/permissions'

export type AppPath =
  | '/'
  | '/ui'
  | '/components'
  | '/projects'
  | '/reports'
  | '/files'
  | '/notifications'
  | '/users'
  | '/departments'
  | '/roles'
  | '/permissions'
  | '/audit-logs'
  | '/integrations'
  | '/profile'
  | '/security'
  | '/settings'

export interface NavItem {
  titleKey: string
  to: AppPath
  icon: LucideIcon
  permission?: PermissionCode
}

export interface NavGroup {
  titleKey: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    titleKey: 'nav:groups.overview',
    items: [
      {
        titleKey: 'nav:items.dashboard',
        to: '/',
        icon: LayoutDashboard,
        permission: PERMISSION_CODES.dashboardRead,
      },
      {
        titleKey: 'nav:items.reports',
        to: '/reports',
        icon: BarChart3,
        permission: PERMISSION_CODES.reportRead,
      },
      {
        titleKey: 'nav:items.ui',
        to: '/ui',
        icon: Palette,
      },
      {
        titleKey: 'nav:items.components',
        to: '/components',
        icon: Boxes,
      },
    ],
  },
  {
    titleKey: 'nav:groups.collaboration',
    items: [
      {
        titleKey: 'nav:items.projects',
        to: '/projects',
        icon: FolderKanban,
        permission: PERMISSION_CODES.projectRead,
      },
      {
        titleKey: 'nav:items.files',
        to: '/files',
        icon: FolderOpen,
        permission: PERMISSION_CODES.fileRead,
      },
      {
        titleKey: 'nav:items.notifications',
        to: '/notifications',
        icon: Bell,
      },
    ],
  },
  {
    titleKey: 'nav:groups.management',
    items: [
      {
        titleKey: 'nav:items.users',
        to: '/users',
        icon: Users,
        permission: PERMISSION_CODES.userRead,
      },
      {
        titleKey: 'nav:items.departments',
        to: '/departments',
        icon: Network,
        permission: PERMISSION_CODES.departmentRead,
      },
      {
        titleKey: 'nav:items.roles',
        to: '/roles',
        icon: ShieldCheck,
        permission: PERMISSION_CODES.roleRead,
      },
      {
        titleKey: 'nav:items.permissions',
        to: '/permissions',
        icon: KeyRound,
        permission: PERMISSION_CODES.permissionRead,
      },
      {
        titleKey: 'nav:items.auditLogs',
        to: '/audit-logs',
        icon: ScrollText,
        permission: PERMISSION_CODES.auditRead,
      },
      {
        titleKey: 'nav:items.integrations',
        to: '/integrations',
        icon: Plug,
        permission: PERMISSION_CODES.integrationRead,
      },
    ],
  },
  {
    titleKey: 'nav:groups.account',
    items: [
      {
        titleKey: 'nav:items.profile',
        to: '/profile',
        icon: UserRound,
      },
      {
        titleKey: 'nav:items.security',
        to: '/security',
        icon: LockKeyhole,
      },
      {
        titleKey: 'nav:items.settings',
        to: '/settings',
        icon: Settings2,
      },
    ],
  },
]

export const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items)

export function isPathActive(pathname: string, path: AppPath) {
  if (path === '/') return pathname === '/'
  return pathname === path || pathname.startsWith(`${path}/`)
}

export function findNavGroup(pathname: string) {
  const item = findNavItem(pathname)
  return item ? NAV_GROUPS.find((group) => group.items.includes(item)) : undefined
}

export function findNavItem(pathname: string) {
  return ALL_NAV_ITEMS.filter((item) => isPathActive(pathname, item.to)).sort(
    (a, b) => b.to.length - a.to.length,
  )[0]
}
