export const DEMO_ACCOUNTS = [
  {
    role: 'admin',
    email: 'admin@fish.dev',
    password: 'Admin123!',
  },
  {
    role: 'manager',
    email: 'manager@fish.dev',
    password: 'Manager123!',
  },
  {
    role: 'viewer',
    email: 'viewer@fish.dev',
    password: 'Viewer123!',
  },
] as const

export const DEMO_DEPARTMENTS = [
  'Engineering',
  'Product',
  'Design',
  'Operations',
  'Marketing',
  'Finance',
] as const

export interface DemoDepartment {
  id: string
  name: string
  parentId: string | null
  managerId?: string
  sortOrder: number
}

export const DEMO_DEPARTMENT_TREE: DemoDepartment[] = [
  {
    id: 'dept-engineering',
    name: 'Engineering',
    parentId: null,
    managerId: 'user-admin',
    sortOrder: 1,
  },
  {
    id: 'dept-engineering-platform',
    name: 'Platform',
    parentId: 'dept-engineering',
    managerId: 'user-admin',
    sortOrder: 1,
  },
  {
    id: 'dept-engineering-frontend',
    name: 'Frontend',
    parentId: 'dept-engineering',
    sortOrder: 2,
  },
  {
    id: 'dept-engineering-quality',
    name: 'Quality',
    parentId: 'dept-engineering',
    sortOrder: 3,
  },
  {
    id: 'dept-product',
    name: 'Product',
    parentId: null,
    managerId: 'user-manager',
    sortOrder: 2,
  },
  {
    id: 'dept-design',
    name: 'Design',
    parentId: null,
    sortOrder: 3,
  },
  {
    id: 'dept-operations',
    name: 'Operations',
    parentId: null,
    managerId: 'user-manager',
    sortOrder: 4,
  },
  {
    id: 'dept-operations-support',
    name: 'Support',
    parentId: 'dept-operations',
    sortOrder: 1,
  },
  {
    id: 'dept-marketing',
    name: 'Marketing',
    parentId: null,
    sortOrder: 5,
  },
  {
    id: 'dept-finance',
    name: 'Finance',
    parentId: null,
    managerId: 'user-viewer',
    sortOrder: 6,
  },
]

export const DEMO_MFA_CODE = '246810'
export const DEMO_MFA_SECRET = 'JBSWY3DPEHPK3PXP'

export const DEMO_INVITE = {
  token: 'fish-demo-invite',
  email: 'jamie.rivera@fish.dev',
  name: 'Jamie Rivera',
} as const
