import { faker } from '@faker-js/faker'

import { DEMO_ACCOUNTS, DEMO_DEPARTMENT_TREE, DEMO_INVITE } from '@/config/demo'
import { DEMO_ROLE_PERMISSIONS } from '@/config/permissions'
import type { AuditAction, AuditEntityType, UserStatus } from '@/types'

import {
  MOCK_DB_VERSION,
  type MockAuditEvent,
  type MockDb,
  type MockDepartmentRecord,
  type MockInvite,
  type MockRoleRecord,
  type MockSession,
  type MockUserRecord,
} from './db/types'

const SEED = 2026
const GENERATED_USER_COUNT = 57
const AUDIT_EVENT_COUNT = 160

const ROLE_DEFINITIONS: Omit<MockRoleRecord, 'permissions'>[] = [
  {
    id: 'admin',
    name: 'Admin',
    description: 'Full access to every feature in the workspace.',
    isSystem: true,
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Manages people and roles, but cannot delete users.',
    isSystem: true,
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access for reporting and audits.',
    isSystem: true,
  },
]

const DEMO_PROFILES = {
  admin: {
    id: 'user-admin',
    name: 'Avery Chen',
    department: 'Engineering',
    departmentId: 'dept-engineering',
    jobTitle: 'Staff Engineer',
    tags: ['owner'],
    bio: 'Product-minded engineer who cares about clean interfaces and fast feedback loops.',
    createdAt: '2024-02-12T09:00:00.000Z',
  },
  manager: {
    id: 'user-manager',
    name: 'Morgan Lee',
    department: 'Operations',
    departmentId: 'dept-operations',
    jobTitle: 'Operations Lead',
    tags: ['on-call'],
    bio: 'Keeps the team unblocked and the roadmap honest.',
    createdAt: '2024-06-03T09:00:00.000Z',
  },
  viewer: {
    id: 'user-viewer',
    name: 'Riley Park',
    department: 'Finance',
    departmentId: 'dept-finance',
    jobTitle: 'Financial Analyst',
    tags: [],
    bio: 'Analyst focused on reporting, budgets and the occasional dashboard deep dive.',
    createdAt: '2025-01-20T09:00:00.000Z',
  },
} as const

const USER_TAGS = ['remote', 'on-call', 'contractor', 'mentor', 'new-hire', 'key-account']

const AUDIT_SEED_ACTIONS: AuditAction[] = [
  'user.created',
  'user.updated',
  'auth.login',
  'profile.updated',
  'role.updated',
  'user.updated',
  'user.created',
  'auth.login',
  'user.deleted',
  'role.created',
  'department.updated',
  'user.restored',
  'role.deleted',
  'department.created',
]

const SEEDED_SESSIONS = [
  {
    userId: 'user-admin',
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    ip: '203.0.113.24',
    createdHoursAgo: 52,
    activeHoursAgo: 2,
  },
  {
    userId: 'user-admin',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
    ip: '198.51.100.18',
    createdHoursAgo: 120,
    activeHoursAgo: 26,
  },
  {
    userId: 'user-manager',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
    ip: '192.0.2.44',
    createdHoursAgo: 18,
    activeHoursAgo: 1,
  },
  {
    userId: 'user-viewer',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
    ip: '192.0.2.87',
    createdHoursAgo: 8,
    activeHoursAgo: 4,
  },
] as const

function createSeededSessions(): MockSession[] {
  const now = Date.now()
  return SEEDED_SESSIONS.map((session) => ({
    id: `session-${crypto.randomUUID()}`,
    userId: session.userId,
    refreshToken: crypto.randomUUID().replace(/-/g, ''),
    createdAt: now - session.createdHoursAgo * 60 * 60 * 1000,
    lastActiveAt: now - session.activeHoursAgo * 60 * 60 * 1000,
    expiresAt: now + 6 * 24 * 60 * 60 * 1000,
    userAgent: session.userAgent,
    ip: session.ip,
  }))
}

export function createDemoInvite(): MockInvite {
  const now = Date.now()
  return {
    token: DEMO_INVITE.token,
    email: DEMO_INVITE.email,
    name: DEMO_INVITE.name,
    roleId: 'manager',
    invitedByName: 'Avery Chen',
    createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(now + 5 * 24 * 60 * 60 * 1000).toISOString(),
  }
}

export function createDemoDepartments(): MockDepartmentRecord[] {
  const seededAt = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()
  return DEMO_DEPARTMENT_TREE.map((department) => ({
    ...department,
    createdAt: seededAt,
  }))
}

function createAuditEvents(
  users: MockUserRecord[],
  roles: MockRoleRecord[],
  departments: MockDepartmentRecord[],
): MockAuditEvent[] {
  const from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

  return Array.from({ length: AUDIT_EVENT_COUNT }, (_, index) => {
    const action = faker.helpers.arrayElement(AUDIT_SEED_ACTIONS)
    const actor = faker.helpers.arrayElement(users)
    let entityType: AuditEntityType = 'user'
    let entityId = actor.id
    let entityLabel = actor.name
    let metadata: Record<string, string> = {}

    if (action.startsWith('user.')) {
      const target = faker.helpers.arrayElement(users)
      entityId = target.id
      entityLabel = target.name
      metadata =
        action === 'user.updated'
          ? {
              field: faker.helpers.arrayElement(['status', 'roleId', 'departmentId']),
              source: 'console',
            }
          : { source: 'console' }
    } else if (action.startsWith('role.')) {
      const role = faker.helpers.arrayElement(roles)
      entityType = 'role'
      entityId = role.id
      entityLabel = role.name
      metadata = { source: 'console' }
    } else if (action.startsWith('department.')) {
      const department = faker.helpers.arrayElement(departments)
      entityType = 'department'
      entityId = department.id
      entityLabel = department.name
      metadata = { source: 'console' }
    } else if (action === 'auth.login') {
      entityType = 'auth'
      metadata = {
        ip: faker.internet.ipv4(),
        browser: faker.helpers.arrayElement(['Chrome', 'Safari', 'Firefox', 'Edge']),
      }
    } else {
      metadata = { field: 'bio' }
    }

    return {
      id: `audit-seed-${index + 1}`,
      action,
      actorId: actor.id,
      actorName: actor.name,
      entityType,
      entityId,
      entityLabel,
      metadata,
      createdAt: faker.date.between({ from, to: new Date() }).toISOString(),
    }
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function createSeedDb(): MockDb {
  faker.seed(SEED)

  const roles: MockRoleRecord[] = ROLE_DEFINITIONS.map((role) => ({
    ...role,
    permissions: [...DEMO_ROLE_PERMISSIONS[role.id]],
  }))

  const departments = createDemoDepartments()

  const users: MockUserRecord[] = DEMO_ACCOUNTS.map((account) => {
    const profile = DEMO_PROFILES[account.role]
    return {
      ...profile,
      tags: [...profile.tags],
      email: account.email,
      password: account.password,
      roleId: account.role,
      status: 'active',
      emailVerified: true,
      twoFactorEnabled: false,
      lastActiveAt: new Date(
        Date.now() - faker.number.int({ min: 5, max: 240 }) * 60_000,
      ).toISOString(),
    }
  })

  for (let index = 0; index < GENERATED_USER_COUNT; index += 1) {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()
    const createdAt = faker.date.between({ from: '2024-01-01', to: '2026-06-30' })
    const status = faker.helpers.arrayElement<UserStatus>([
      'active',
      'active',
      'active',
      'invited',
      'inactive',
    ])
    const lastActiveAt =
      status === 'invited' ? createdAt : faker.date.between({ from: createdAt, to: new Date() })
    const department = faker.helpers.arrayElement(departments)

    users.push({
      id: `user-${faker.string.alphanumeric({ length: 10, casing: 'lower' })}${index}`,
      name: `${firstName} ${lastName}`,
      email: `${firstName}.${lastName}.${index}@example.com`
        .toLowerCase()
        .replace(/[^a-z0-9.@-]/g, ''),
      password: 'Password123!',
      roleId: faker.helpers.arrayElement(['viewer', 'viewer', 'manager', 'manager']),
      status,
      department: department.name,
      departmentId: department.id,
      jobTitle: faker.person.jobTitle(),
      tags:
        faker.helpers.maybe(() => [faker.helpers.arrayElement(USER_TAGS)], { probability: 0.3 }) ??
        [],
      bio: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.35 }),
      emailVerified: status !== 'invited',
      twoFactorEnabled: false,
      createdAt: createdAt.toISOString(),
      lastActiveAt: lastActiveAt.toISOString(),
    })
  }

  return {
    version: MOCK_DB_VERSION,
    seededAt: new Date().toISOString(),
    users,
    roles,
    departments,
    auditEvents: createAuditEvents(users, roles, departments),
    sessions: createSeededSessions(),
    loginAttempts: {},
    mfaChallenges: {},
    verificationTokens: [],
    passwordResetTokens: [],
    invites: [createDemoInvite()],
  }
}
