import { beforeEach, describe, expect, it } from 'vitest'

import { MOCK_DB_STORAGE_KEY, MOCK_DB_VERSION } from '@/mocks/db/types'

import { readDb } from './store'

const ROLE = {
  id: 'admin',
  name: 'Admin',
  description: 'Full access',
  permissions: ['*'],
  isSystem: true,
}

const V1_USER = {
  id: 'user-admin',
  name: 'Avery Chen',
  email: 'admin@fish.dev',
  password: 'Admin123!',
  roleId: 'admin',
  status: 'active' as const,
  department: 'Engineering',
  createdAt: '2024-02-12T09:00:00.000Z',
  lastActiveAt: '2024-02-12T09:00:00.000Z',
}

const ACTIVITY = [
  {
    id: 'activity-1',
    action: 'user.updated' as const,
    actorName: 'Avery Chen',
    target: 'Morgan Lee',
    createdAt: '2024-03-01T10:00:00.000Z',
  },
  {
    id: 'activity-2',
    action: 'auth.login' as const,
    actorName: 'Morgan Lee',
    target: 'Morgan Lee',
    createdAt: '2024-03-02T10:00:00.000Z',
  },
]

function seedStorage(value: unknown) {
  localStorage.setItem(MOCK_DB_STORAGE_KEY, JSON.stringify(value))
}

describe('mock database migrations', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('migrates a v1 database to v4 without losing users', () => {
    seedStorage({
      version: 1,
      seededAt: '2024-01-01T00:00:00.000Z',
      users: [V1_USER],
      roles: [ROLE],
      activity: ACTIVITY,
      refreshTokens: {
        'refresh-token': { userId: 'user-admin', expiresAt: Date.now() + 60_000 },
      },
    })

    const db = readDb()

    expect(db.version).toBe(MOCK_DB_VERSION)
    expect(db.users).toHaveLength(1)
    expect(db.users[0]).toMatchObject({
      id: 'user-admin',
      emailVerified: true,
      twoFactorEnabled: false,
      tags: [],
      departmentId: 'dept-engineering',
    })
    expect(db.sessions).toHaveLength(1)
    expect(db.departments.length).toBeGreaterThan(0)
    expect(db.auditEvents).toHaveLength(62)
    expect(db.auditEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'user.updated',
          entityType: 'user',
          entityLabel: 'Morgan Lee',
        }),
      ]),
    )
    expect(db.projects.length).toBeGreaterThan(0)
    expect(db.files.length).toBeGreaterThan(0)
    expect(db.integrations.length).toBeGreaterThan(0)
    expect(db.notifications.length).toBeGreaterThan(0)
    expect(db).not.toHaveProperty('activity')
    expect(db).not.toHaveProperty('refreshTokens')
  })

  it('migrates a v2 database and keeps sessions and invites', () => {
    seedStorage({
      version: 2,
      seededAt: '2024-01-01T00:00:00.000Z',
      users: [{ ...V1_USER, emailVerified: true, twoFactorEnabled: false }],
      roles: [ROLE],
      activity: ACTIVITY,
      sessions: [
        {
          id: 'session-1',
          userId: 'user-admin',
          refreshToken: 'refresh-token',
          createdAt: Date.now(),
          lastActiveAt: Date.now(),
          expiresAt: Date.now() + 60_000,
          userAgent: 'Chrome',
          ip: '127.0.0.1',
        },
      ],
      loginAttempts: {},
      mfaChallenges: {},
      verificationTokens: [],
      passwordResetTokens: [],
      invites: [],
    })

    const db = readDb()

    expect(db.version).toBe(MOCK_DB_VERSION)
    expect(db.users[0]?.tags).toEqual([])
    expect(db.sessions).toHaveLength(1)
    expect(db.invites).toEqual([])
    expect(db.auditEvents).toHaveLength(62)

    const stored = JSON.parse(localStorage.getItem(MOCK_DB_STORAGE_KEY) ?? '{}')
    expect(stored.version).toBe(MOCK_DB_VERSION)
    expect(stored.projects).toHaveLength(db.projects.length)
  })

  it('migrates a v3 database and merges the new permission codes', () => {
    seedStorage({
      version: 3,
      seededAt: '2024-01-01T00:00:00.000Z',
      users: [{ ...V1_USER, tags: [], emailVerified: true, twoFactorEnabled: false }],
      roles: [
        ROLE,
        {
          id: 'viewer',
          name: 'Viewer',
          description: 'Read only',
          permissions: ['dashboard:read'],
          isSystem: true,
        },
      ],
      departments: [],
      auditEvents: [],
      sessions: [],
      loginAttempts: {},
      mfaChallenges: {},
      verificationTokens: [],
      passwordResetTokens: [],
      invites: [],
    })

    const db = readDb()

    expect(db.version).toBe(MOCK_DB_VERSION)
    expect(db.users).toHaveLength(1)
    expect(db.departments).toEqual([])
    expect(db.projects).toHaveLength(12)
    expect(db.tasks).toHaveLength(72)
    expect(db.milestones).toHaveLength(48)
    expect(db.files).toHaveLength(18)
    expect(db.integrations).toHaveLength(6)
    expect(db.roles.find((role) => role.id === 'viewer')?.permissions).toEqual(
      expect.arrayContaining(['dashboard:read', 'project:read', 'file:read', 'report:read']),
    )
    expect(db.roles.find((role) => role.id === 'viewer')?.permissions).not.toContain(
      'project:manage',
    )
    expect(db.notificationPreferences['user-admin']).toBeDefined()
  })

  it('migrates a v4 database and seeds the approval inbox', () => {
    seedStorage({
      version: 4,
      seededAt: '2024-01-01T00:00:00.000Z',
      users: [{ ...V1_USER, tags: [], emailVerified: true, twoFactorEnabled: false }],
      roles: [
        ROLE,
        {
          id: 'manager',
          name: 'Manager',
          description: 'Team lead',
          permissions: ['user:read'],
          isSystem: true,
        },
      ],
      departments: [],
      auditEvents: [],
      sessions: [],
      loginAttempts: {},
      mfaChallenges: {},
      verificationTokens: [],
      passwordResetTokens: [],
      invites: [],
      notifications: [],
      notificationPreferences: {},
      projects: [],
      tasks: [],
      milestones: [],
      fileFolders: [],
      files: [],
      integrations: [],
      deliveries: [],
    })

    const db = readDb()

    expect(db.version).toBe(MOCK_DB_VERSION)
    expect(db.workflows).toHaveLength(8)
    expect(db.workflows.find((entry) => entry.id === 'workflow-pur-1')).toMatchObject({
      status: 'pending',
      currentStep: 0,
    })
    expect(db.workflowSteps.length).toBeGreaterThan(8)
    expect(db.workflowComments.length).toBeGreaterThan(0)
    expect(db.dictionaryTypes).toHaveLength(3)
    expect(db.dictionaryItems.length).toBeGreaterThan(10)
    expect(db.roles.find((role) => role.id === 'manager')?.permissions).toEqual(
      expect.arrayContaining(['user:read', 'workflow:read', 'workflow:approve']),
    )
  })

  it('migrates a v5 database and seeds the dictionaries', () => {
    seedStorage({
      version: 5,
      seededAt: '2024-01-01T00:00:00.000Z',
      users: [{ ...V1_USER, tags: [], emailVerified: true, twoFactorEnabled: false }],
      roles: [ROLE],
      departments: [],
      auditEvents: [],
      sessions: [],
      loginAttempts: {},
      mfaChallenges: {},
      verificationTokens: [],
      passwordResetTokens: [],
      invites: [],
      notifications: [],
      notificationPreferences: {},
      projects: [],
      tasks: [],
      milestones: [],
      fileFolders: [],
      files: [],
      integrations: [],
      deliveries: [],
      workflows: [],
      workflowSteps: [],
      workflowComments: [],
    })

    const db = readDb()

    expect(db.version).toBe(MOCK_DB_VERSION)
    expect(db.workflows).toEqual([])
    expect(db.dictionaryTypes.map((entry) => entry.code)).toEqual([
      'user_tag',
      'expense_category',
      'approval_priority',
    ])
    expect(db.dictionaryItems.find((entry) => entry.value === 'on-call')).toMatchObject({
      dictionaryId: 'dict-user-tag',
      enabled: true,
    })
  })

  it('treats a migrated v4 database as complete on the next read', () => {
    seedStorage({
      version: 3,
      seededAt: '2024-01-01T00:00:00.000Z',
      users: [{ ...V1_USER, tags: [], emailVerified: true, twoFactorEnabled: false }],
      roles: [ROLE],
      departments: [],
      auditEvents: [],
      sessions: [],
      loginAttempts: {},
      mfaChallenges: {},
      verificationTokens: [],
      passwordResetTokens: [],
      invites: [],
    })

    const first = readDb()
    const second = readDb()

    expect(second.projects).toEqual(first.projects)
    expect(second.auditEvents).toEqual(first.auditEvents)
    expect(second.notifications).toEqual(first.notifications)
  })

  it('resets unknown versions and incomplete payloads', () => {
    seedStorage({
      version: 99,
      seededAt: '2024-01-01T00:00:00.000Z',
      users: [V1_USER],
      roles: [ROLE],
      activity: ACTIVITY,
      sessions: [],
    })

    const fromUnknown = readDb()
    expect(fromUnknown.version).toBe(MOCK_DB_VERSION)
    expect(fromUnknown.users.length).toBeGreaterThan(1)
    expect(fromUnknown.auditEvents.length).toBeGreaterThan(0)

    seedStorage({
      version: MOCK_DB_VERSION,
      seededAt: '2024-01-01T00:00:00.000Z',
      users: [V1_USER],
      roles: [ROLE],
      auditEvents: [],
      sessions: [],
    })

    const fromIncomplete = readDb()
    expect(fromIncomplete.users.length).toBeGreaterThan(1)
    expect(fromIncomplete.departments.length).toBeGreaterThan(0)
  })

  it('keeps a complete v6 database untouched', () => {
    const seeded = {
      version: MOCK_DB_VERSION,
      seededAt: '2024-01-01T00:00:00.000Z',
      users: [{ ...V1_USER, tags: [], emailVerified: true, twoFactorEnabled: false }],
      roles: [ROLE],
      departments: [],
      auditEvents: [],
      sessions: [],
      loginAttempts: {},
      mfaChallenges: {},
      verificationTokens: [],
      passwordResetTokens: [],
      invites: [],
      notifications: [],
      notificationPreferences: {},
      projects: [],
      tasks: [],
      milestones: [],
      fileFolders: [],
      files: [],
      integrations: [],
      deliveries: [],
      workflows: [],
      workflowSteps: [],
      workflowComments: [],
      dictionaryTypes: [],
      dictionaryItems: [],
    }
    seedStorage(seeded)

    const db = readDb()

    expect(db.users).toHaveLength(1)
    expect(db.departments).toEqual([])
    expect(db.projects).toEqual([])
    expect(db.workflows).toEqual([])
    expect(db.dictionaryTypes).toEqual([])
  })
})
