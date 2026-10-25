import { http } from 'msw'

import { env } from '@/config/env'
import { PERMISSION_CODES } from '@/config/permissions'
import type { User, UserStatus } from '@/types'

import { authorize, revokeSessionsForUser } from '../auth'
import {
  findDepartment,
  findDepartmentByName,
  findRole,
  findUserByEmail,
  findUserById,
  logActivity,
  queryUsers,
  readDb,
  serializeUser,
  writeDb,
  type UserListQuery,
} from '../db/store'
import type { MockDb, MockUserRecord } from '../db/types'
import { HttpError, readJson, run, runNoContent } from '../http'

const API = env.apiBaseUrl
const STATUSES: UserStatus[] = ['active', 'invited', 'inactive']
const MAX_AVATAR_LENGTH = 400_000
const MAX_TAGS = 8
const MAX_TAG_LENGTH = 24

interface UserBody {
  name?: string
  email?: string
  roleId?: string
  status?: UserStatus
  department?: string
  departmentId?: string
  jobTitle?: string
  tags?: string[]
  avatar?: string
}

interface BulkBody {
  ids?: string[]
}

interface BulkStatusBody extends BulkBody {
  status?: UserStatus
}

interface UserImportBody {
  users?: Array<{
    name?: unknown
    email?: unknown
    role?: unknown
    department?: unknown
  }>
}

function readIds(body: BulkBody) {
  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Select at least one user.')
  }
  const ids = [...new Set(body.ids.filter((id): id is string => typeof id === 'string'))]
  if (ids.length === 0 || ids.length > 100) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Select between 1 and 100 users.')
  }
  return ids
}

function ensureUserFields(db: MockDb, body: UserBody, partial: boolean) {
  const name = body.name?.trim()
  const email = body.email?.trim().toLowerCase()
  const roleId = body.roleId
  const status = body.status
  const departmentId = body.departmentId
  const departmentName = body.department?.trim()

  if (!partial || body.name !== undefined) {
    if (!name || name.length < 2) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Name must be at least 2 characters.')
    }
  }
  if (!partial || body.email !== undefined) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'A valid email is required.')
    }
  }
  if (!partial || body.roleId !== undefined) {
    if (!roleId || !findRole(db, roleId)) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'A valid role is required.')
    }
  }
  if (!partial || body.status !== undefined) {
    if (!status || !STATUSES.includes(status)) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'A valid status is required.')
    }
  }

  let department: { id: string; name: string } | undefined
  const departmentInput = departmentId ?? departmentName
  if (!partial || departmentInput !== undefined) {
    if (!departmentInput) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Department is required.')
    }
    const record = departmentId
      ? findDepartment(db, departmentId)
      : findDepartmentByName(db, departmentName!)
    if (!record) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'A valid department is required.')
    }
    department = { id: record.id, name: record.name }
  }

  return { name, email, roleId, status, department }
}

function ensureTags(tags: string[] | undefined) {
  if (tags === undefined) return undefined
  if (!Array.isArray(tags)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Tags must be a list of short labels.')
  }
  const normalized = [
    ...new Set(
      tags
        .filter((tag): tag is string => typeof tag === 'string')
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ]
  if (normalized.length > MAX_TAGS || normalized.some((tag) => tag.length > MAX_TAG_LENGTH)) {
    throw new HttpError(
      400,
      'VALIDATION_ERROR',
      `Use at most ${MAX_TAGS} tags of ${MAX_TAG_LENGTH} characters or fewer.`,
    )
  }
  return normalized
}

function ensureJobTitle(jobTitle: string | undefined) {
  if (jobTitle === undefined) return undefined
  const trimmed = jobTitle.trim()
  if (trimmed.length > 80) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Job title must be 80 characters or fewer.')
  }
  return trimmed || undefined
}

function ensureAvatar(avatar: string | undefined) {
  if (avatar === undefined) return undefined
  if (typeof avatar !== 'string') {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Avatar must be an image.')
  }
  if (avatar.length > MAX_AVATAR_LENGTH) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Choose a smaller image.')
  }
  return avatar || undefined
}

export const userHandlers = [
  http.get(`${API}/users`, ({ request }) =>
    run(() => {
      const db = readDb()
      authorize(db, request, PERMISSION_CODES.userRead)

      const url = new URL(request.url)
      const query: UserListQuery = {
        page: Number(url.searchParams.get('page') ?? 1),
        pageSize: Number(url.searchParams.get('pageSize') ?? 10),
        q: url.searchParams.get('q') ?? undefined,
        roleId: url.searchParams.get('roleId') ?? undefined,
        status: url.searchParams.get('status') ?? undefined,
        departmentId: url.searchParams.get('departmentId') ?? undefined,
        includeDescendants: url.searchParams.get('includeDescendants') === '1',
        sort: url.searchParams.get('sort') ?? undefined,
        order: url.searchParams.get('order') ?? undefined,
      }
      return queryUsers(db, query)
    }),
  ),

  http.post(`${API}/users`, ({ request }) =>
    run(async () => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.userCreate)
      const body = (await readJson<UserBody>(request)) ?? {}
      const { name, email, roleId, status, department } = ensureUserFields(db, body, false)
      const tags = ensureTags(body.tags) ?? []
      const jobTitle = ensureJobTitle(body.jobTitle)
      const avatar = ensureAvatar(body.avatar)

      if (findUserByEmail(db, email!)) {
        throw new HttpError(409, 'EMAIL_TAKEN', 'A user with this email already exists.')
      }

      const now = new Date().toISOString()
      const record = {
        id: `user-${crypto.randomUUID()}`,
        name: name!,
        email: email!,
        password: 'Password123!',
        roleId: roleId!,
        status: status!,
        department: department!.name,
        departmentId: department!.id,
        jobTitle,
        tags,
        avatar,
        emailVerified: true,
        twoFactorEnabled: false,
        createdAt: now,
        lastActiveAt: now,
      }

      db.users.unshift(record)
      logActivity(db, 'user.created', actor.user.name, record.name, {
        actorId: actor.user.id,
        entityType: 'user',
        entityId: record.id,
        metadata: { roleId: record.roleId, departmentId: record.departmentId },
      })
      writeDb(db)
      return serializeUser(db, record)
    }),
  ),

  http.post(`${API}/users/import`, ({ request }) =>
    run(async () => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.userCreate)
      const body = (await readJson<UserImportBody>(request)) ?? {}
      const rows = Array.isArray(body.users) ? body.users : []

      if (rows.length === 0) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Import at least one user.')
      }
      if (rows.length > 100) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Import 100 users or fewer.')
      }

      const defaultRole = findRole(db, 'viewer')
      if (!defaultRole) {
        throw new HttpError(500, 'CONFIG_ERROR', 'The default viewer role is missing.')
      }
      const fallbackDepartment = findDepartment(db, 'dept-engineering')
      const now = new Date().toISOString()
      const created: MockUserRecord[] = []
      const skipped: Array<{ email: string; message: string }> = []
      const seen = new Set<string>()

      for (const row of rows) {
        const name = typeof row.name === 'string' ? row.name.trim() : ''
        const email = typeof row.email === 'string' ? row.email.trim().toLowerCase() : ''

        if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          skipped.push({ email, message: 'Name and a valid email are required.' })
          continue
        }
        if (seen.has(email) || findUserByEmail(db, email)) {
          skipped.push({ email, message: 'A user with this email already exists.' })
          continue
        }

        const roleInput = typeof row.role === 'string' ? row.role.trim().toLowerCase() : ''
        const role =
          db.roles.find(
            (entry) =>
              entry.id.toLowerCase() === roleInput || entry.name.toLowerCase() === roleInput,
          ) ?? defaultRole

        const departmentInput =
          typeof row.department === 'string' ? row.department.trim().toLowerCase() : ''
        const department =
          (departmentInput
            ? db.departments.find(
                (entry) =>
                  entry.id.toLowerCase() === departmentInput ||
                  entry.name.toLowerCase() === departmentInput,
              )
            : undefined) ?? fallbackDepartment

        const record: MockUserRecord = {
          id: `user-${crypto.randomUUID()}`,
          name,
          email,
          password: 'Password123!',
          roleId: role.id,
          status: 'active',
          department: department?.name ?? 'General',
          departmentId: department?.id,
          tags: [],
          emailVerified: true,
          twoFactorEnabled: false,
          createdAt: now,
          lastActiveAt: now,
        }

        db.users.unshift(record)
        created.push(record)
        seen.add(email)
        logActivity(db, 'user.created', actor.user.name, record.name, {
          actorId: actor.user.id,
          entityType: 'user',
          entityId: record.id,
          metadata: { source: 'import', roleId: record.roleId },
        })
      }

      if (created.length > 0) writeDb(db)

      return {
        created: created.map((record) => serializeUser(db, record)),
        skipped,
      }
    }),
  ),

  http.post(`${API}/users/bulk-status`, ({ request }) =>
    run(async () => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.userUpdate)
      const body = (await readJson<BulkStatusBody>(request)) ?? {}
      const ids = readIds(body)
      const status = body.status

      if (!status || !STATUSES.includes(status)) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'A valid status is required.')
      }

      const updated: string[] = []
      const skipped: string[] = []

      for (const id of ids) {
        const user = findUserById(db, id)
        if (!user || user.deletedAt || user.id === actor.user.id) {
          skipped.push(id)
          continue
        }
        if (user.status === status) {
          skipped.push(id)
          continue
        }

        user.status = status
        if (status === 'inactive') revokeSessionsForUser(db, user.id)
        logActivity(db, 'user.updated', actor.user.name, user.name, {
          actorId: actor.user.id,
          entityType: 'user',
          entityId: user.id,
          metadata: { field: 'status', value: status },
        })
        updated.push(id)
      }

      writeDb(db)
      return { updated, skipped }
    }),
  ),

  http.post(`${API}/users/bulk-delete`, ({ request }) =>
    run(async () => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.userDelete)
      const body = (await readJson<BulkBody>(request)) ?? {}
      const ids = readIds(body)

      const deleted: string[] = []
      const skipped: string[] = []
      const now = new Date().toISOString()

      for (const id of ids) {
        const user = findUserById(db, id)
        if (!user || user.deletedAt || user.id === actor.user.id) {
          skipped.push(id)
          continue
        }

        user.deletedAt = now
        revokeSessionsForUser(db, user.id)
        logActivity(db, 'user.deleted', actor.user.name, user.name, {
          actorId: actor.user.id,
          entityType: 'user',
          entityId: user.id,
        })
        deleted.push(id)
      }

      writeDb(db)
      return { deleted, skipped }
    }),
  ),

  http.post(`${API}/users/restore`, ({ request }) =>
    run(async () => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.userDelete)
      const body = (await readJson<BulkBody>(request)) ?? {}
      const ids = readIds(body)

      const restored: User[] = []

      for (const id of ids) {
        const user = findUserById(db, id)
        if (!user || !user.deletedAt) continue

        user.deletedAt = undefined
        logActivity(db, 'user.restored', actor.user.name, user.name, {
          actorId: actor.user.id,
          entityType: 'user',
          entityId: user.id,
        })
        restored.push(serializeUser(db, user))
      }

      writeDb(db)
      return { restored }
    }),
  ),

  http.get(`${API}/users/:id`, ({ request, params }) =>
    run(() => {
      const db = readDb()
      authorize(db, request, PERMISSION_CODES.userRead)
      const user = findUserById(db, String(params.id))
      if (!user || user.deletedAt) throw new HttpError(404, 'USER_NOT_FOUND', 'User not found.')
      return serializeUser(db, user)
    }),
  ),

  http.patch(`${API}/users/:id`, ({ request, params }) =>
    run(async () => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.userUpdate)
      const user = findUserById(db, String(params.id))
      if (!user || user.deletedAt) throw new HttpError(404, 'USER_NOT_FOUND', 'User not found.')

      const body = (await readJson<UserBody>(request)) ?? {}
      const fields = ensureUserFields(db, body, true)
      const tags = ensureTags(body.tags)
      const jobTitle = ensureJobTitle(body.jobTitle)
      const avatar = ensureAvatar(body.avatar)
      const changed: string[] = []

      if (fields.email && fields.email !== user.email.toLowerCase()) {
        const duplicate = findUserByEmail(db, fields.email)
        if (duplicate && duplicate.id !== user.id) {
          throw new HttpError(409, 'EMAIL_TAKEN', 'A user with this email already exists.')
        }
      }

      if (user.id === actor.user.id && fields.status === 'inactive') {
        throw new HttpError(
          400,
          'CANNOT_DEACTIVATE_SELF',
          'You cannot deactivate your own account.',
        )
      }

      if (user.id === actor.user.id && fields.roleId && fields.roleId !== user.roleId) {
        throw new HttpError(400, 'CANNOT_CHANGE_OWN_ROLE', 'You cannot change your own role.')
      }

      if (fields.name !== undefined && fields.name !== user.name) {
        user.name = fields.name
        changed.push('name')
      }
      if (fields.email !== undefined && fields.email !== user.email) {
        user.email = fields.email
        changed.push('email')
      }
      if (fields.roleId !== undefined && fields.roleId !== user.roleId) {
        user.roleId = fields.roleId
        changed.push('roleId')
      }
      if (fields.status !== undefined && fields.status !== user.status) {
        user.status = fields.status
        changed.push('status')
      }
      if (fields.department !== undefined && fields.department.id !== user.departmentId) {
        user.department = fields.department.name
        user.departmentId = fields.department.id
        changed.push('departmentId')
      }
      if (tags !== undefined) {
        user.tags = tags
        changed.push('tags')
      }
      if (body.jobTitle !== undefined) {
        user.jobTitle = jobTitle
        changed.push('jobTitle')
      }
      if (body.avatar !== undefined) {
        user.avatar = avatar
        changed.push('avatar')
      }

      if (fields.status === 'inactive') revokeSessionsForUser(db, user.id)

      logActivity(db, 'user.updated', actor.user.name, user.name, {
        actorId: actor.user.id,
        entityType: 'user',
        entityId: user.id,
        metadata: changed.length > 0 ? { fields: changed.join(', ') } : {},
      })
      writeDb(db)
      return serializeUser(db, user)
    }),
  ),

  http.delete(`${API}/users/:id`, ({ request, params }) =>
    runNoContent(async () => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.userDelete)
      const user = findUserById(db, String(params.id))
      if (!user || user.deletedAt) throw new HttpError(404, 'USER_NOT_FOUND', 'User not found.')
      if (user.id === actor.user.id) {
        throw new HttpError(400, 'CANNOT_DELETE_SELF', 'You cannot delete your own account.')
      }

      user.deletedAt = new Date().toISOString()
      revokeSessionsForUser(db, user.id)
      logActivity(db, 'user.deleted', actor.user.name, user.name, {
        actorId: actor.user.id,
        entityType: 'user',
        entityId: user.id,
      })
      writeDb(db)
    }),
  ),
]
