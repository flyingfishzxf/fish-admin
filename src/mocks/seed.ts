import { faker } from '@faker-js/faker'

import { DEMO_ACCOUNTS, DEMO_DEPARTMENTS, DEMO_INVITE } from '@/config/demo'
import { DEMO_ROLE_PERMISSIONS } from '@/config/permissions'
import type { ActivityAction, UserStatus } from '@/types'

import {
  MOCK_DB_VERSION,
  type MockDb,
  type MockInvite,
  type MockRoleRecord,
  type MockSession,
  type MockUserRecord,
} from './db/types'

const SEED = 2026
const GENERATED_USER_COUNT = 57

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
    bio: 'Product-minded engineer who cares about clean interfaces and fast feedback loops.',
    createdAt: '2024-02-12T09:00:00.000Z',
  },
  manager: {
    id: 'user-manager',
    name: 'Morgan Lee',
    department: 'Operations',
    bio: 'Keeps the team unblocked and the roadmap honest.',
    createdAt: '2024-06-03T09:00:00.000Z',
  },
  viewer: {
    id: 'user-viewer',
    name: 'Riley Park',
    department: 'Finance',
    bio: 'Analyst focused on reporting, budgets and the occasional dashboard deep dive.',
    createdAt: '2025-01-20T09:00:00.000Z',
  },
} as const

const ACTIVITY_ACTIONS: ActivityAction[] = [
  'user.created',
  'user.updated',
  'auth.login',
  'profile.updated',
  'role.updated',
  'user.updated',
  'user.created',
  'auth.login',
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

export function createSeedDb(): MockDb {
  faker.seed(SEED)

  const roles: MockRoleRecord[] = ROLE_DEFINITIONS.map((role) => ({
    ...role,
    permissions: [...DEMO_ROLE_PERMISSIONS[role.id]],
  }))

  const users: MockUserRecord[] = DEMO_ACCOUNTS.map((account) => {
    const profile = DEMO_PROFILES[account.role]
    return {
      ...profile,
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

    users.push({
      id: `user-${faker.string.alphanumeric({ length: 10, casing: 'lower' })}${index}`,
      name: `${firstName} ${lastName}`,
      email: `${firstName}.${lastName}.${index}@example.com`
        .toLowerCase()
        .replace(/[^a-z0-9.@-]/g, ''),
      password: 'Password123!',
      roleId: faker.helpers.arrayElement(['viewer', 'viewer', 'manager', 'manager']),
      status,
      department: faker.helpers.arrayElement(DEMO_DEPARTMENTS),
      bio: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.35 }),
      emailVerified: status !== 'invited',
      twoFactorEnabled: false,
      createdAt: createdAt.toISOString(),
      lastActiveAt: lastActiveAt.toISOString(),
    })
  }

  const createdUsers = users.filter((user) => user.id !== DEMO_PROFILES.admin.id)
  const activity = Array.from({ length: 16 }, (_, index) => {
    const action = faker.helpers.arrayElement(ACTIVITY_ACTIONS)
    const actor = faker.helpers.arrayElement(createdUsers)
    let target = actor.name

    if (action === 'user.created' || action === 'user.updated') {
      target = faker.helpers.arrayElement(createdUsers).name
    } else if (action === 'user.deleted') {
      target = faker.helpers.arrayElement(users).name
    } else if (action === 'role.updated') {
      target = faker.helpers.arrayElement(roles).name
    }

    return {
      id: `activity-${index + 1}`,
      action,
      actorName: actor.name,
      target,
      createdAt: new Date(
        Date.now() - faker.number.int({ min: 1, max: 96 }) * 60 * 60 * 1000,
      ).toISOString(),
    }
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return {
    version: MOCK_DB_VERSION,
    seededAt: new Date().toISOString(),
    users,
    roles,
    activity,
    sessions: createSeededSessions(),
    loginAttempts: {},
    mfaChallenges: {},
    verificationTokens: [],
    passwordResetTokens: [],
    invites: [createDemoInvite()],
  }
}
