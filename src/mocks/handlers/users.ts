import { http } from 'msw'

import { env } from '@/config/env'
import { PERMISSION_CODES } from '@/config/permissions'
import type { User, UserStatus } from '@/types'

import { authorize, revokeSessionsForUser } from '../auth'
import {
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
import { HttpError, readJson, run, runNoContent } from '../http'

const API = env.apiBaseUrl
const STATUSES: UserStatus[] = ['active', 'invited', 'inactive']

interface UserBody {
  name?: string
  email?: string
  roleId?: string
  status?: UserStatus
  department?: string
}

interface BulkBody {
  ids?: string[]
}

interface BulkStatusBody extends BulkBody {
  status?: UserStatus
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

function ensureUserFields(db: ReturnType<typeof readDb>, body: UserBody, partial: boolean) {
  const name = body.name?.trim()
  const email = body.email?.trim().toLowerCase()
  const roleId = body.roleId
  const status = body.status
  const department = body.department?.trim()

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
  if (!partial || body.department !== undefined) {
    if (!department) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Department is required.')
    }
  }

  return { name, email, roleId, status, department }
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
        department: department!,
        emailVerified: true,
        twoFactorEnabled: false,
        createdAt: now,
        lastActiveAt: now,
      }

      db.users.unshift(record)
      logActivity(db, 'user.created', actor.user.name, record.name)
      writeDb(db)
      return serializeUser(db, record)
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
        logActivity(db, 'user.updated', actor.user.name, user.name)
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
        logActivity(db, 'user.deleted', actor.user.name, user.name)
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
        logActivity(db, 'user.restored', actor.user.name, user.name)
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

      if (fields.name !== undefined) user.name = fields.name!
      if (fields.email !== undefined) user.email = fields.email!
      if (fields.roleId !== undefined) user.roleId = fields.roleId!
      if (fields.status !== undefined) user.status = fields.status!
      if (fields.department !== undefined) user.department = fields.department!

      if (fields.status === 'inactive') revokeSessionsForUser(db, user.id)

      logActivity(db, 'user.updated', actor.user.name, user.name)
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
      logActivity(db, 'user.deleted', actor.user.name, user.name)
      writeDb(db)
    }),
  ),
]
