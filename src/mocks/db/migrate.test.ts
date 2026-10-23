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

  it('migrates a v1 database to v3 without losing users', () => {
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
    expect(db.auditEvents).toHaveLength(2)
    expect(db.auditEvents[0]).toMatchObject({
      action: 'user.updated',
      entityType: 'user',
      entityLabel: 'Morgan Lee',
    })
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
    expect(db.auditEvents).toHaveLength(2)

    const stored = JSON.parse(localStorage.getItem(MOCK_DB_STORAGE_KEY) ?? '{}')
    expect(stored.version).toBe(MOCK_DB_VERSION)
  })

  it('resets unknown versions and incomplete v3 payloads', () => {
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

  it('keeps a complete v3 database untouched', () => {
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
    }
    seedStorage(seeded)

    const db = readDb()

    expect(db.users).toHaveLength(1)
    expect(db.departments).toEqual([])
  })
})
