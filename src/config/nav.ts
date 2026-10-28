import {
  BarChart3,
  Bell,
  BookMarked,
  FolderKanban,
  FolderOpen,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  Network,
  Plug,
  ScrollText,
  Settings2,
  ShieldCheck,
  UserRound,
  Users,
  Workflow,
  type LucideIcon,
} from 'lucide-react'

import { PERMISSION_CODES, type PermissionCode } from '@/config/permissions'

export type AppPath =
  | '/'
  | '/projects'
  | '/workflows'
  | '/reports'
  | '/files'
  | '/notifications'
  | '/users'
  | '/departments'
  | '/roles'
  | '/permissions'
  | '/dictionaries'
  | '/audit-logs'
  | '/integrations'
  | '/profile'
  | '/security'
  | '/settings'

interface NavItemBase {
  titleKey: string
  icon: LucideIcon
  permission?: PermissionCode
}

export interface InternalNavItem extends NavItemBase {
  to: AppPath
  // The discriminant: internal entries never carry the flag, so `item.external`
  // reads on the union and the guard narrows in both directions.
  external?: never
  children?: InternalNavItem[]
}

export interface ExternalNavItem extends NavItemBase {
  href: string
  external: true
}

export type NavItem = InternalNavItem | ExternalNavItem

export interface NavGroup {
  titleKey: string
  items: NavItem[]
}

export function isExternalNavItem(item: NavItem): item is ExternalNavItem {
  return item.external === true
}

export function internalNavItems(items: NavItem[]): InternalNavItem[] {
  return items.filter((item): item is InternalNavItem => !isExternalNavItem(item))
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
        titleKey: 'nav:items.workflows',
        to: '/workflows',
        icon: Workflow,
        permission: PERMISSION_CODES.workflowRead,
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
        titleKey: 'nav:items.dictionaries',
        to: '/dictionaries',
        icon: BookMarked,
        permission: PERMISSION_CODES.dictionaryRead,
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

export const ALL_NAV_ITEMS: InternalNavItem[] = internalNavItems(
  NAV_GROUPS.flatMap((group) => group.items),
)

// Every entry, internal and external: the command palette searches all of them.
export function flattenNavItems(groups: NavGroup[]): NavItem[] {
  return groups.flatMap((group) =>
    group.items.flatMap((item): NavItem[] =>
      isExternalNavItem(item) ? [item] : [item, ...(item.children ?? [])],
    ),
  )
}

// Internal paths only. An external entry is not a route in this build, so it is
// invisible to path matching, the 403 guard and the tab bar.
export function flattenInternalNavItems(groups: NavGroup[]): InternalNavItem[] {
  return groups.flatMap((group) =>
    group.items.flatMap((item): InternalNavItem[] =>
      isExternalNavItem(item) ? [] : [item, ...(item.children ?? [])],
    ),
  )
}

// The menu a server sends can only point at a route this build actually has:
// anything else renders the shell's 404, so a backend that lists a page this
// template no longer ships drops out here and the resolver follows automatically.
const NAV_PATHS: readonly string[] = flattenInternalNavItems(NAV_GROUPS).map((item) => item.to)

export function isAppPath(value: unknown): value is AppPath {
  return typeof value === 'string' && NAV_PATHS.includes(value)
}

/**
 * Whether a page is one the menu owns. Detail routes match their parent, so
 * hiding `/users` also makes `/users/42` unreachable; the 403 screen and the
 * 404 catch-all are not menu pages and are never redirected back to 403.
 */
export function isManagedNavPath(pathname: string) {
  return flattenInternalNavItems(NAV_GROUPS).some((item) => isPathActive(pathname, item.to))
}

export function isPathActive(pathname: string, path: AppPath) {
  if (path === '/') return pathname === '/'
  return pathname === path || pathname.startsWith(`${path}/`)
}

export function findNavGroup(pathname: string, groups: NavGroup[] = NAV_GROUPS) {
  const item = findNavItem(pathname, groups)
  return item
    ? groups.find((group) =>
        flattenInternalNavItems([group]).some((candidate) => candidate.to === item.to),
      )
    : undefined
}

export function findNavItem(pathname: string, groups: NavGroup[] = NAV_GROUPS) {
  return flattenInternalNavItems(groups)
    .filter((item) => isPathActive(pathname, item.to))
    .sort((a, b) => b.to.length - a.to.length)[0]
}
