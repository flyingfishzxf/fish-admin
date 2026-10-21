import type { ActivityAction, AuthSession, AuthUser, PaginatedResult, User } from '@/types'

import { createDemoInvite, createSeedDb } from '../seed'
import {
  MOCK_DB_STORAGE_KEY,
  MOCK_DB_VERSION,
  type MockDb,
  type MockInvite,
  type MockRoleRecord,
  type MockSession,
  type MockUserRecord,
} from './types'

let memoryDb: MockDb | null = null

interface LegacyDbV1 {
  version: 1
  seededAt: string
  users: Array<Omit<MockUserRecord, 'emailVerified' | 'twoFactorEnabled'>>
  roles: MockRoleRecord[]
  activity: MockDb['activity']
  refreshTokens?: Record<string, { userId: string; expiresAt: number }>
}

function hasStorage() {
  try {
    return typeof localStorage !== 'undefined'
  } catch {
    return false
  }
}

function migrateV1(legacy: LegacyDbV1): MockDb {
  const now = Date.now()
  const users = legacy.users.map((user) => ({
    ...user,
    emailVerified: user.status !== 'invited',
    twoFactorEnabled: false,
  }))
  const sessions: MockSession[] = Object.entries(legacy.refreshTokens ?? {}).map(
    ([token, record]) => ({
      id: `session-${crypto.randomUUID()}`,
      userId: record.userId,
      refreshToken: token,
      createdAt: now,
      lastActiveAt: now,
      expiresAt: record.expiresAt,
      userAgent: 'Browser session',
      ip: '127.0.0.1',
    }),
  )

  return {
    version: MOCK_DB_VERSION,
    seededAt: legacy.seededAt,
    users,
    roles: legacy.roles,
    activity: legacy.activity,
    sessions,
    loginAttempts: {},
    mfaChallenges: {},
    verificationTokens: [],
    passwordResetTokens: [],
    invites: [createDemoInvite()],
  }
}

export function readDb(): MockDb {
  if (!hasStorage()) {
    memoryDb ??= createSeedDb()
    return memoryDb
  }

  const raw = localStorage.getItem(MOCK_DB_STORAGE_KEY)
  if (!raw) return resetDb()

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown> | null
    if (!parsed || typeof parsed !== 'object') return resetDb()

    if (parsed.version === 1) {
      const migrated = migrateV1(parsed as unknown as LegacyDbV1)
      writeDb(migrated)
      return migrated
    }

    if (
      parsed.version !== MOCK_DB_VERSION ||
      !Array.isArray(parsed.users) ||
      !Array.isArray(parsed.roles) ||
      !Array.isArray(parsed.activity) ||
      !Array.isArray(parsed.sessions)
    ) {
      return resetDb()
    }
    return parsed as unknown as MockDb
  } catch {
    return resetDb()
  }
}

export function writeDb(db: MockDb) {
  memoryDb = db
  if (!hasStorage()) return

  try {
    localStorage.setItem(MOCK_DB_STORAGE_KEY, JSON.stringify(db))
  } catch {
    // Storage can be full or blocked; the in-memory copy keeps the demo usable.
  }
}

export function resetDb(): MockDb {
  const db = createSeedDb()
  writeDb(db)
  return db
}

export function findRole(db: MockDb, roleId: string): MockRoleRecord | undefined {
  return db.roles.find((role) => role.id === roleId)
}

export function findUserByEmail(db: MockDb, email: string) {
  const normalized = email.trim().toLowerCase()
  return db.users.find((user) => user.email.toLowerCase() === normalized)
}

export function findUserById(db: MockDb, id: string) {
  return db.users.find((user) => user.id === id)
}

export function serializeUser(db: MockDb, record: MockUserRecord): User {
  const role = findRole(db, record.roleId)
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    avatar: record.avatar,
    roleId: record.roleId,
    roleName: role?.name ?? 'Unknown',
    status: record.status,
    department: record.department,
    bio: record.bio,
    emailVerified: record.emailVerified,
    createdAt: record.createdAt,
    lastActiveAt: record.lastActiveAt,
    deletedAt: record.deletedAt,
  }
}

export function rolePermissions(db: MockDb, roleId: string) {
  return findRole(db, roleId)?.permissions ?? []
}

export function serializeAuthUser(db: MockDb, record: MockUserRecord): AuthUser {
  const user = serializeUser(db, record)
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    bio: user.bio,
    roleId: user.roleId,
    roleName: user.roleName,
    permissions: [...rolePermissions(db, record.roleId)],
    emailVerified: user.emailVerified,
    twoFactorEnabled: record.twoFactorEnabled,
  }
}

export function serializeSession(session: MockSession, currentSessionId: string): AuthSession {
  return {
    id: session.id,
    ...parseUserAgent(session.userAgent),
    ip: session.ip,
    createdAt: new Date(session.createdAt).toISOString(),
    lastActiveAt: new Date(session.lastActiveAt).toISOString(),
    expiresAt: new Date(session.expiresAt).toISOString(),
    current: session.id === currentSessionId,
  }
}

function parseUserAgent(userAgent: string) {
  let browser = 'Browser'
  if (/Edg\//.test(userAgent)) browser = 'Edge'
  else if (/OPR\//.test(userAgent)) browser = 'Opera'
  else if (/Chrome\//.test(userAgent)) browser = 'Chrome'
  else if (/Firefox\//.test(userAgent)) browser = 'Firefox'
  else if (/Safari\//.test(userAgent)) browser = 'Safari'

  let os = 'Unknown'
  if (/iPhone|iPad|iPod/.test(userAgent)) os = 'iOS'
  else if (/Android/.test(userAgent)) os = 'Android'
  else if (/Windows/.test(userAgent)) os = 'Windows'
  else if (/Mac OS X/.test(userAgent)) os = 'macOS'
  else if (/Linux/.test(userAgent)) os = 'Linux'

  return { browser, os }
}

export function serializeInvite(db: MockDb, invite: MockInvite) {
  return {
    email: invite.email,
    name: invite.name,
    roleName: findRole(db, invite.roleId)?.name ?? 'Viewer',
    invitedByName: invite.invitedByName,
    expiresAt: invite.expiresAt,
  }
}

export function serializeRole(db: MockDb, role: MockRoleRecord) {
  return {
    ...role,
    userCount: db.users.filter((user) => user.roleId === role.id && !user.deletedAt).length,
  }
}

export interface UserListQuery {
  page?: number
  pageSize?: number
  q?: string
  roleId?: string
  status?: string
  sort?: string
  order?: string
}

type SortKey = 'name' | 'email' | 'role' | 'createdAt' | 'lastActiveAt'
export function queryUsers(db: MockDb, query: UserListQuery): PaginatedResult<User> {
  const pageSize = Math.min(Math.max(query.pageSize ?? 10, 1), 100)
  const search = query.q?.trim().toLowerCase() ?? ''

  let filtered = db.users.filter((user) => {
    if (user.deletedAt) return false
    if (query.roleId && user.roleId !== query.roleId) return false
    if (query.status && user.status !== query.status) return false
    if (!search) return true
    return (
      user.name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      user.department.toLowerCase().includes(search)
    )
  })

  const sortKey = (query.sort ?? 'createdAt') as SortKey
  const direction = query.order === 'asc' ? 1 : -1

  filtered = [...filtered].sort((a, b) => {
    if (sortKey === 'role') {
      return roleName(db, a.roleId).localeCompare(roleName(db, b.roleId)) * direction
    }
    if (sortKey === 'createdAt' || sortKey === 'lastActiveAt') {
      return (new Date(a[sortKey]).getTime() - new Date(b[sortKey]).getTime()) * direction
    }
    return a[sortKey].localeCompare(b[sortKey]) * direction
  })

  const total = filtered.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(query.page ?? 1, 1), pageCount)
  const start = (page - 1) * pageSize

  return {
    items: filtered.slice(start, start + pageSize).map((user) => serializeUser(db, user)),
    total,
    page,
    pageSize,
    pageCount,
  }
}

function roleName(db: MockDb, roleId: string) {
  return findRole(db, roleId)?.name ?? ''
}

export function logActivity(db: MockDb, action: ActivityAction, actorName: string, target: string) {
  db.activity.unshift({
    id: `activity-${crypto.randomUUID()}`,
    action,
    actorName,
    target,
    createdAt: new Date().toISOString(),
  })
  db.activity = db.activity.slice(0, 40)
}
