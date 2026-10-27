import { DEMO_ROLE_PERMISSIONS } from '@/config/permissions'
import type {
  ActivityAction,
  ActivityItem,
  AuthSession,
  AuthUser,
  AuditAction,
  AuditEntityType,
  Department,
  PaginatedResult,
  User,
} from '@/types'

import { createDemoDepartments, createDemoInvite, createSeedDb } from '../seed'
import { createDictionarySeed } from '../seed-dictionaries'
import { createWorkflowSeed } from '../seed-workflows'
import { createWorkspaceSeed } from '../seed-workspace'
import { syntheticUserRecords } from './synthetic-users'
import {
  MOCK_DB_STORAGE_KEY,
  MOCK_DB_VERSION,
  type MockAuditEvent,
  type MockDb,
  type MockDepartmentRecord,
  type MockInvite,
  type MockRoleRecord,
  type MockSession,
  type MockUserRecord,
} from './types'

let memoryDb: MockDb | null = null

type UserV2 = Omit<MockUserRecord, 'departmentId' | 'jobTitle' | 'tags'>

interface LegacyDbV1 {
  version: 1
  seededAt: string
  users: Array<Omit<UserV2, 'emailVerified' | 'twoFactorEnabled'>>
  roles: MockRoleRecord[]
  activity: ActivityItem[]
  refreshTokens?: Record<string, { userId: string; expiresAt: number }>
}

interface LegacyDbV2 {
  version: 2
  seededAt: string
  users: UserV2[]
  roles: MockRoleRecord[]
  activity: ActivityItem[]
  sessions: MockSession[]
  loginAttempts: MockDb['loginAttempts']
  mfaChallenges: MockDb['mfaChallenges']
  verificationTokens: MockDb['verificationTokens']
  passwordResetTokens: MockDb['passwordResetTokens']
  invites: MockInvite[]
}

interface LegacyDbV3 {
  version: 3
  seededAt: string
  users: MockUserRecord[]
  roles: MockRoleRecord[]
  departments: MockDepartmentRecord[]
  auditEvents: MockAuditEvent[]
  sessions: MockSession[]
  loginAttempts: MockDb['loginAttempts']
  mfaChallenges: MockDb['mfaChallenges']
  verificationTokens: MockDb['verificationTokens']
  passwordResetTokens: MockDb['passwordResetTokens']
  invites: MockInvite[]
}

type LegacyDbV4 = Omit<
  MockDb,
  | 'version'
  | 'workflows'
  | 'workflowSteps'
  | 'workflowComments'
  | 'dictionaryTypes'
  | 'dictionaryItems'
> & {
  version: 4
}

type LegacyDbV5 = Omit<MockDb, 'version' | 'dictionaryTypes' | 'dictionaryItems'> & {
  version: 5
}

const ACTIVITY_ACTIONS = new Set<ActivityAction>([
  'user.created',
  'user.updated',
  'user.deleted',
  'user.restored',
  'role.updated',
  'auth.login',
  'profile.updated',
])

function hasStorage() {
  try {
    return typeof localStorage !== 'undefined'
  } catch {
    return false
  }
}

function activityEntityType(action: AuditAction | ActivityAction): AuditEntityType {
  if (action === 'auth.login') return 'auth'
  if (action.startsWith('role.')) return 'role'
  if (action.startsWith('department.')) return 'department'
  if (action.startsWith('project.')) return 'project'
  if (action.startsWith('workflow.')) return 'workflow'
  if (action.startsWith('dictionary.')) return 'dictionary'
  if (action.startsWith('file.')) return 'file'
  if (action.startsWith('integration.')) return 'integration'
  return 'user'
}

function migrateV1(legacy: LegacyDbV1): LegacyDbV2 {
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
    version: 2,
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

function migrateV2(legacy: LegacyDbV2): LegacyDbV3 {
  const departments = createDemoDepartments()
  const departmentByName = new Map(
    departments.map((department) => [department.name.toLowerCase(), department]),
  )

  const users: MockUserRecord[] = legacy.users.map((user) => ({
    ...user,
    departmentId: departmentByName.get(user.department.toLowerCase())?.id,
    tags: [],
  }))

  const auditEvents: MockAuditEvent[] = legacy.activity.map((item, index) => ({
    id: `audit-migrated-${index}-${item.id}`,
    action: item.action,
    actorName: item.actorName,
    entityType: activityEntityType(item.action),
    entityLabel: item.target,
    metadata: {},
    createdAt: item.createdAt,
  }))

  return {
    version: 3,
    seededAt: legacy.seededAt,
    users,
    roles: legacy.roles,
    departments,
    auditEvents,
    sessions: legacy.sessions,
    loginAttempts: legacy.loginAttempts,
    mfaChallenges: legacy.mfaChallenges,
    verificationTokens: legacy.verificationTokens,
    passwordResetTokens: legacy.passwordResetTokens,
    invites: legacy.invites,
  }
}

function mergeRolePermissions(role: MockRoleRecord): MockRoleRecord {
  const defined = DEMO_ROLE_PERMISSIONS[role.id]
  if (!defined) return role

  return {
    ...role,
    permissions: Array.from(new Set([...role.permissions, ...defined])),
  }
}

function migrateV3(legacy: LegacyDbV3): LegacyDbV4 {
  const workspace = createWorkspaceSeed(legacy.users, legacy.departments)
  const auditEvents = [...workspace.auditEvents, ...legacy.auditEvents]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 500)

  return {
    version: 4,
    seededAt: legacy.seededAt,
    users: legacy.users,
    roles: legacy.roles.map(mergeRolePermissions),
    departments: legacy.departments,
    auditEvents,
    sessions: legacy.sessions,
    loginAttempts: legacy.loginAttempts,
    mfaChallenges: legacy.mfaChallenges,
    verificationTokens: legacy.verificationTokens,
    passwordResetTokens: legacy.passwordResetTokens,
    invites: legacy.invites,
    notifications: workspace.notifications,
    notificationPreferences: workspace.notificationPreferences,
    projects: workspace.projects,
    tasks: workspace.tasks,
    milestones: workspace.milestones,
    fileFolders: workspace.fileFolders,
    files: workspace.files,
    integrations: workspace.integrations,
    deliveries: workspace.deliveries,
  }
}

/**
 * Re-seeds the workflow collections instead of inventing instances from the
 * surviving audit trail: the v4 database has no approval chain to reconstruct.
 * Users, roles, sessions and the whole workspace are carried over untouched.
 */
function migrateV4(legacy: LegacyDbV4): LegacyDbV5 {
  const workflow = createWorkflowSeed(legacy.users)

  return {
    ...legacy,
    version: 5,
    roles: legacy.roles.map(mergeRolePermissions),
    workflows: workflow.workflows,
    workflowSteps: workflow.workflowSteps,
    workflowComments: workflow.workflowComments,
  }
}

/** Dictionaries are demo reference data, so a v5 database gets the seed as-is. */
function migrateV5(legacy: LegacyDbV5): MockDb {
  const dictionary = createDictionarySeed()

  return {
    ...legacy,
    version: MOCK_DB_VERSION,
    dictionaryTypes: dictionary.types,
    dictionaryItems: dictionary.items,
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
      const migrated = migrateV5(
        migrateV4(migrateV3(migrateV2(migrateV1(parsed as unknown as LegacyDbV1)))),
      )
      writeDb(migrated)
      return migrated
    }

    if (parsed.version === 2) {
      const migrated = migrateV5(migrateV4(migrateV3(migrateV2(parsed as unknown as LegacyDbV2))))
      writeDb(migrated)
      return migrated
    }

    if (parsed.version === 3) {
      const migrated = migrateV5(migrateV4(migrateV3(parsed as unknown as LegacyDbV3)))
      writeDb(migrated)
      return migrated
    }

    if (parsed.version === 4) {
      const migrated = migrateV5(migrateV4(parsed as unknown as LegacyDbV4))
      writeDb(migrated)
      return migrated
    }

    if (parsed.version === 5) {
      const migrated = migrateV5(parsed as unknown as LegacyDbV5)
      writeDb(migrated)
      return migrated
    }

    if (
      parsed.version !== MOCK_DB_VERSION ||
      !Array.isArray(parsed.users) ||
      !Array.isArray(parsed.roles) ||
      !Array.isArray(parsed.departments) ||
      !Array.isArray(parsed.auditEvents) ||
      !Array.isArray(parsed.sessions) ||
      !Array.isArray(parsed.notifications) ||
      !Array.isArray(parsed.projects) ||
      !Array.isArray(parsed.tasks) ||
      !Array.isArray(parsed.milestones) ||
      !Array.isArray(parsed.fileFolders) ||
      !Array.isArray(parsed.files) ||
      !Array.isArray(parsed.integrations) ||
      !Array.isArray(parsed.deliveries) ||
      !Array.isArray(parsed.workflows) ||
      !Array.isArray(parsed.workflowSteps) ||
      !Array.isArray(parsed.workflowComments) ||
      !Array.isArray(parsed.dictionaryTypes) ||
      !Array.isArray(parsed.dictionaryItems) ||
      !parsed.notificationPreferences ||
      typeof parsed.notificationPreferences !== 'object'
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

export function findDepartment(db: MockDb, id: string) {
  return db.departments.find((department) => department.id === id)
}

export function findDepartmentByName(db: MockDb, name: string) {
  const normalized = name.trim().toLowerCase()
  return db.departments.find((department) => department.name.toLowerCase() === normalized)
}

export function departmentPath(db: MockDb, id: string): string[] {
  const path: string[] = []
  const seen = new Set<string>()
  let current = findDepartment(db, id)

  while (current && !seen.has(current.id)) {
    seen.add(current.id)
    path.unshift(current.name)
    const parentId = current.parentId
    current = parentId ? findDepartment(db, parentId) : undefined
  }

  return path
}

export function departmentSubtreeIds(db: MockDb, id: string): Set<string> {
  const ids = new Set<string>([id])
  let added = true

  while (added) {
    added = false
    for (const department of db.departments) {
      if (department.parentId && ids.has(department.parentId) && !ids.has(department.id)) {
        ids.add(department.id)
        added = true
      }
    }
  }

  return ids
}

export function serializeUser(db: MockDb, record: MockUserRecord): User {
  const role = findRole(db, record.roleId)
  const departmentId = record.departmentId ?? findDepartmentByName(db, record.department)?.id
  const path = departmentId ? departmentPath(db, departmentId) : []

  return {
    id: record.id,
    name: record.name,
    email: record.email,
    avatar: record.avatar,
    roleId: record.roleId,
    roleName: role?.name ?? 'Unknown',
    status: record.status,
    department: record.department,
    departmentId,
    departmentPath: path.length > 0 ? path : [record.department],
    jobTitle: record.jobTitle,
    tags: record.tags ?? [],
    bio: record.bio,
    emailVerified: record.emailVerified,
    twoFactorEnabled: record.twoFactorEnabled,
    createdAt: record.createdAt,
    lastActiveAt: record.lastActiveAt,
    deletedAt: record.deletedAt,
  }
}

export function serializeDepartment(db: MockDb, record: MockDepartmentRecord): Department {
  const subtree = departmentSubtreeIds(db, record.id)
  const activeUsers = db.users.filter((user) => !user.deletedAt)

  return {
    ...record,
    managerName: record.managerId ? findUserById(db, record.managerId)?.name : undefined,
    directMemberCount: activeUsers.filter((user) => user.departmentId === record.id).length,
    memberCount: activeUsers.filter((user) => user.departmentId && subtree.has(user.departmentId))
      .length,
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
  departmentId?: string
  includeDescendants?: boolean
  sort?: string
  order?: string
  dataset?: string
}

type SortKey = 'name' | 'email' | 'role' | 'createdAt' | 'lastActiveAt'
export function queryUsers(db: MockDb, query: UserListQuery): PaginatedResult<User> {
  const large = query.dataset === 'large'
  const pageSize = Math.min(Math.max(query.pageSize ?? 10, 1), large ? 5000 : 100)
  const search = query.q?.trim().toLowerCase() ?? ''
  const departmentIds = query.departmentId
    ? query.includeDescendants
      ? departmentSubtreeIds(db, query.departmentId)
      : new Set([query.departmentId])
    : null
  const source = large ? syntheticUserRecords(db) : db.users

  let filtered = source.filter((user) => {
    if (user.deletedAt) return false
    if (query.roleId && user.roleId !== query.roleId) return false
    if (query.status && user.status !== query.status) return false
    if (departmentIds && (!user.departmentId || !departmentIds.has(user.departmentId))) {
      return false
    }
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

export interface AuditMeta {
  actorId?: string
  entityType?: AuditEntityType
  entityId?: string
  metadata?: Record<string, string>
}

export function logAuditEvent(
  db: MockDb,
  event: {
    action: AuditAction
    actorName: string
    entityLabel: string
    actorId?: string
    entityType?: AuditEntityType
    entityId?: string
    metadata?: Record<string, string>
  },
) {
  const record: MockAuditEvent = {
    id: `audit-${crypto.randomUUID()}`,
    action: event.action,
    actorId: event.actorId,
    actorName: event.actorName,
    entityType: event.entityType ?? activityEntityType(event.action),
    entityId: event.entityId,
    entityLabel: event.entityLabel,
    metadata: event.metadata ?? {},
    createdAt: new Date().toISOString(),
  }

  db.auditEvents.unshift(record)
  db.auditEvents = db.auditEvents.slice(0, 500)
  return record
}

export function logActivity(
  db: MockDb,
  action: ActivityAction,
  actorName: string,
  target: string,
  meta: AuditMeta = {},
) {
  logAuditEvent(db, { action, actorName, entityLabel: target, ...meta })
}

export function recentActivity(db: MockDb, limit = 8): ActivityItem[] {
  return db.auditEvents
    .filter((event) => ACTIVITY_ACTIONS.has(event.action as ActivityAction))
    .slice(0, limit)
    .map((event) => ({
      id: event.id,
      action: event.action as ActivityAction,
      actorName: event.actorName,
      target: event.entityLabel,
      createdAt: event.createdAt,
    }))
}
