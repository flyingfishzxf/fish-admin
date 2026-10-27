export const PERMISSION_CODES = {
  dashboardRead: 'dashboard:read',
  projectRead: 'project:read',
  projectManage: 'project:manage',
  workflowRead: 'workflow:read',
  workflowApprove: 'workflow:approve',
  fileRead: 'file:read',
  fileManage: 'file:manage',
  reportRead: 'report:read',
  integrationRead: 'integration:read',
  integrationManage: 'integration:manage',
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
  dictionaryRead: 'dictionary:read',
  dictionaryManage: 'dictionary:manage',
  demoReset: 'demo:reset',
} as const

export type PermissionCode = (typeof PERMISSION_CODES)[keyof typeof PERMISSION_CODES]

export const PERMISSION_GROUPS = [
  'dashboard',
  'project',
  'workflow',
  'file',
  'report',
  'integration',
  'user',
  'role',
  'audit',
  'department',
  'permission',
  'dictionary',
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
    code: PERMISSION_CODES.projectRead,
    group: 'project',
    labelKey: 'roles:permissionItems.projectRead',
    descriptionKey: 'roles:permissionItems.projectReadDescription',
  },
  {
    code: PERMISSION_CODES.projectManage,
    group: 'project',
    labelKey: 'roles:permissionItems.projectManage',
    descriptionKey: 'roles:permissionItems.projectManageDescription',
  },
  {
    code: PERMISSION_CODES.workflowRead,
    group: 'workflow',
    labelKey: 'roles:permissionItems.workflowRead',
    descriptionKey: 'roles:permissionItems.workflowReadDescription',
  },
  {
    code: PERMISSION_CODES.workflowApprove,
    group: 'workflow',
    labelKey: 'roles:permissionItems.workflowApprove',
    descriptionKey: 'roles:permissionItems.workflowApproveDescription',
  },
  {
    code: PERMISSION_CODES.fileRead,
    group: 'file',
    labelKey: 'roles:permissionItems.fileRead',
    descriptionKey: 'roles:permissionItems.fileReadDescription',
  },
  {
    code: PERMISSION_CODES.fileManage,
    group: 'file',
    labelKey: 'roles:permissionItems.fileManage',
    descriptionKey: 'roles:permissionItems.fileManageDescription',
  },
  {
    code: PERMISSION_CODES.reportRead,
    group: 'report',
    labelKey: 'roles:permissionItems.reportRead',
    descriptionKey: 'roles:permissionItems.reportReadDescription',
  },
  {
    code: PERMISSION_CODES.integrationRead,
    group: 'integration',
    labelKey: 'roles:permissionItems.integrationRead',
    descriptionKey: 'roles:permissionItems.integrationReadDescription',
  },
  {
    code: PERMISSION_CODES.integrationManage,
    group: 'integration',
    labelKey: 'roles:permissionItems.integrationManage',
    descriptionKey: 'roles:permissionItems.integrationManageDescription',
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
    code: PERMISSION_CODES.dictionaryRead,
    group: 'dictionary',
    labelKey: 'roles:permissionItems.dictionaryRead',
    descriptionKey: 'roles:permissionItems.dictionaryReadDescription',
  },
  {
    code: PERMISSION_CODES.dictionaryManage,
    group: 'dictionary',
    labelKey: 'roles:permissionItems.dictionaryManage',
    descriptionKey: 'roles:permissionItems.dictionaryManageDescription',
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
    PERMISSION_CODES.projectRead,
    PERMISSION_CODES.projectManage,
    PERMISSION_CODES.workflowRead,
    PERMISSION_CODES.workflowApprove,
    PERMISSION_CODES.fileRead,
    PERMISSION_CODES.fileManage,
    PERMISSION_CODES.reportRead,
    PERMISSION_CODES.integrationRead,
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
    PERMISSION_CODES.dictionaryRead,
    PERMISSION_CODES.dictionaryManage,
  ],
  viewer: [
    PERMISSION_CODES.dashboardRead,
    PERMISSION_CODES.projectRead,
    PERMISSION_CODES.fileRead,
    PERMISSION_CODES.reportRead,
    PERMISSION_CODES.integrationRead,
    PERMISSION_CODES.userRead,
    PERMISSION_CODES.auditRead,
    PERMISSION_CODES.departmentRead,
    PERMISSION_CODES.dictionaryRead,
  ],
}
