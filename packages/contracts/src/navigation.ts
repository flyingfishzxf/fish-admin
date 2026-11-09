import { PERMISSION_CODES, type PermissionCode } from './permissions'

export const APP_PATHS = [
  '/',
  '/projects',
  '/workflows',
  '/reports',
  '/files',
  '/notifications',
  '/users',
  '/departments',
  '/roles',
  '/permissions',
  '/dictionaries',
  '/audit-logs',
  '/integrations',
  '/profile',
  '/security',
  '/settings',
] as const

export type AppPath = (typeof APP_PATHS)[number]

export const MENU_ICON_NAMES = [
  'bar-chart-3',
  'bell',
  'book-marked',
  'boxes',
  'circle-dot',
  'folder-kanban',
  'folder-open',
  'key-round',
  'layout-dashboard',
  'lock-keyhole',
  'network',
  'palette',
  'plug',
  'scroll-text',
  'settings-2',
  'shield-check',
  'user-round',
  'users',
  'workflow',
] as const

export type MenuIconName = (typeof MENU_ICON_NAMES)[number]

export interface NavRouteContract {
  titleKey: string
  to: AppPath
  icon: MenuIconName
  permission?: PermissionCode
}

export interface NavGroupContract {
  titleKey: string
  items: NavRouteContract[]
}

export const NAV_CONTRACT: NavGroupContract[] = [
  {
    titleKey: 'nav:groups.overview',
    items: [
      {
        titleKey: 'nav:items.dashboard',
        to: '/',
        icon: 'layout-dashboard',
        permission: PERMISSION_CODES.dashboardRead,
      },
      {
        titleKey: 'nav:items.reports',
        to: '/reports',
        icon: 'bar-chart-3',
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
        icon: 'folder-kanban',
        permission: PERMISSION_CODES.projectRead,
      },
      {
        titleKey: 'nav:items.workflows',
        to: '/workflows',
        icon: 'workflow',
        permission: PERMISSION_CODES.workflowRead,
      },
      {
        titleKey: 'nav:items.files',
        to: '/files',
        icon: 'folder-open',
        permission: PERMISSION_CODES.fileRead,
      },
      {
        titleKey: 'nav:items.notifications',
        to: '/notifications',
        icon: 'bell',
      },
    ],
  },
  {
    titleKey: 'nav:groups.management',
    items: [
      {
        titleKey: 'nav:items.users',
        to: '/users',
        icon: 'users',
        permission: PERMISSION_CODES.userRead,
      },
      {
        titleKey: 'nav:items.departments',
        to: '/departments',
        icon: 'network',
        permission: PERMISSION_CODES.departmentRead,
      },
      {
        titleKey: 'nav:items.roles',
        to: '/roles',
        icon: 'shield-check',
        permission: PERMISSION_CODES.roleRead,
      },
      {
        titleKey: 'nav:items.permissions',
        to: '/permissions',
        icon: 'key-round',
        permission: PERMISSION_CODES.permissionRead,
      },
      {
        titleKey: 'nav:items.dictionaries',
        to: '/dictionaries',
        icon: 'book-marked',
        permission: PERMISSION_CODES.dictionaryRead,
      },
      {
        titleKey: 'nav:items.auditLogs',
        to: '/audit-logs',
        icon: 'scroll-text',
        permission: PERMISSION_CODES.auditRead,
      },
      {
        titleKey: 'nav:items.integrations',
        to: '/integrations',
        icon: 'plug',
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
        icon: 'user-round',
      },
      {
        titleKey: 'nav:items.security',
        to: '/security',
        icon: 'lock-keyhole',
      },
      {
        titleKey: 'nav:items.settings',
        to: '/settings',
        icon: 'settings-2',
      },
    ],
  },
]

export interface MenuRoutePayload {
  titleKey: string
  /** Must name a route this build ships; the resolver drops anything else. */
  path: string
  /** A key of `MENU_ICON_NAMES`. */
  icon: string
  permission?: string
  children?: MenuRoutePayload[]
}

export interface MenuGroupPayload {
  titleKey: string
  items: MenuRoutePayload[]
}

export interface MenuPayload {
  groups: MenuGroupPayload[]
}
