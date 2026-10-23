export const PERMISSION_CODES = {
  dashboardRead: 'dashboard:read',
  userRead: 'user:read',
  userCreate: 'user:create',
  userUpdate: 'user:update',
  userDelete: 'user:delete',
  roleRead: 'role:read',
  roleCreate: 'role:create',
  roleUpdate: 'role:update',
  roleDelete: 'role:delete',
  auditRead: 'audit:read',
  departmentRead: 'department:read',
  departmentManage: 'department:manage',
  permissionRead: 'permission:read',
  demoReset: 'demo:reset',
} as const

export type PermissionCode = (typeof PERMISSION_CODES)[keyof typeof PERMISSION_CODES]

export const PERMISSION_GROUPS = [
  'dashboard',
  'user',
  'role',
  'audit',
  'department',
  'permission',
  'demo',
] as const

export type PermissionGroup = (typeof PERMISSION_GROUPS)[number]

export interface PermissionDefinition {
  code: PermissionCode
  group: PermissionGroup
  labelKey: string
  descriptionKey: string
}

export const PERMISSIONS: PermissionDefinition[] = [
  {
    code: PERMISSION_CODES.dashboardRead,
    group: 'dashboard',
    labelKey: 'roles:permissionItems.dashboardRead',
    descriptionKey: 'roles:permissionItems.dashboardReadDescription',
  },
  {
    code: PERMISSION_CODES.userRead,
    group: 'user',
    labelKey: 'roles:permissionItems.userRead',
    descriptionKey: 'roles:permissionItems.userReadDescription',
  },
  {
    code: PERMISSION_CODES.userCreate,
    group: 'user',
    labelKey: 'roles:permissionItems.userCreate',
    descriptionKey: 'roles:permissionItems.userCreateDescription',
  },
  {
    code: PERMISSION_CODES.userUpdate,
    group: 'user',
    labelKey: 'roles:permissionItems.userUpdate',
    descriptionKey: 'roles:permissionItems.userUpdateDescription',
  },
  {
    code: PERMISSION_CODES.userDelete,
    group: 'user',
    labelKey: 'roles:permissionItems.userDelete',
    descriptionKey: 'roles:permissionItems.userDeleteDescription',
  },
  {
    code: PERMISSION_CODES.roleRead,
    group: 'role',
    labelKey: 'roles:permissionItems.roleRead',
    descriptionKey: 'roles:permissionItems.roleReadDescription',
  },
  {
    code: PERMISSION_CODES.roleCreate,
    group: 'role',
    labelKey: 'roles:permissionItems.roleCreate',
    descriptionKey: 'roles:permissionItems.roleCreateDescription',
  },
  {
    code: PERMISSION_CODES.roleUpdate,
    group: 'role',
    labelKey: 'roles:permissionItems.roleUpdate',
    descriptionKey: 'roles:permissionItems.roleUpdateDescription',
  },
  {
    code: PERMISSION_CODES.roleDelete,
    group: 'role',
    labelKey: 'roles:permissionItems.roleDelete',
    descriptionKey: 'roles:permissionItems.roleDeleteDescription',
  },
  {
    code: PERMISSION_CODES.auditRead,
    group: 'audit',
    labelKey: 'roles:permissionItems.auditRead',
    descriptionKey: 'roles:permissionItems.auditReadDescription',
  },
  {
    code: PERMISSION_CODES.departmentRead,
    group: 'department',
    labelKey: 'roles:permissionItems.departmentRead',
    descriptionKey: 'roles:permissionItems.departmentReadDescription',
  },
  {
    code: PERMISSION_CODES.departmentManage,
    group: 'department',
    labelKey: 'roles:permissionItems.departmentManage',
    descriptionKey: 'roles:permissionItems.departmentManageDescription',
  },
  {
    code: PERMISSION_CODES.permissionRead,
    group: 'permission',
    labelKey: 'roles:permissionItems.permissionRead',
    descriptionKey: 'roles:permissionItems.permissionReadDescription',
  },
  {
    code: PERMISSION_CODES.demoReset,
    group: 'demo',
    labelKey: 'roles:permissionItems.demoReset',
    descriptionKey: 'roles:permissionItems.demoResetDescription',
  },
]

export const ALL_PERMISSION_CODES = PERMISSIONS.map((permission) => permission.code)

export const DEMO_ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['*'],
  manager: [
    PERMISSION_CODES.dashboardRead,
    PERMISSION_CODES.userRead,
    PERMISSION_CODES.userCreate,
    PERMISSION_CODES.userUpdate,
    PERMISSION_CODES.roleRead,
    PERMISSION_CODES.roleCreate,
    PERMISSION_CODES.roleUpdate,
    PERMISSION_CODES.auditRead,
    PERMISSION_CODES.departmentRead,
    PERMISSION_CODES.departmentManage,
    PERMISSION_CODES.permissionRead,
  ],
  viewer: [
    PERMISSION_CODES.dashboardRead,
    PERMISSION_CODES.userRead,
    PERMISSION_CODES.auditRead,
    PERMISSION_CODES.departmentRead,
  ],
}
