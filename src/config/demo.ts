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

export const DEMO_MFA_CODE = '246810'
export const DEMO_MFA_SECRET = 'JBSWY3DPEHPK3PXP'

export const DEMO_INVITE = {
  token: 'fish-demo-invite',
  email: 'jamie.rivera@fish.dev',
  name: 'Jamie Rivera',
} as const
