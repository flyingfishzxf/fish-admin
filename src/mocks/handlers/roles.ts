import { http } from 'msw'

import { env } from '@/config/env'
import { ALL_PERMISSION_CODES, PERMISSION_CODES, PERMISSIONS } from '@/config/permissions'

import { authorize } from '../auth'
import { findRole, logActivity, logAuditEvent, readDb, serializeRole, writeDb } from '../db/store'
import type { MockDb, MockRoleRecord } from '../db/types'
import { HttpError, readJson, run, runNoContent } from '../http'

const API = env.apiBaseUrl

interface PermissionsBody {
  permissions?: unknown
}

interface RoleBody {
  name?: string
  description?: string
}

function validateRoleName(name: string | undefined) {
  const trimmed = name?.trim()
  if (!trimmed || trimmed.length < 2 || trimmed.length > 40) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Role name must be 2–40 characters.')
  }
  return trimmed
}

function validateDescription(description: string | undefined) {
  if (description === undefined) return undefined
  const trimmed = description.trim()
  if (trimmed.length > 200) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Description must be 200 characters or fewer.')
  }
  return trimmed
}

function ensureNameAvailable(db: MockDb, name: string, currentId?: string) {
  const normalized = name.toLowerCase()
  const existing = db.roles.find((role) => role.name.toLowerCase() === normalized)
  if (existing && existing.id !== currentId) {
    throw new HttpError(409, 'ROLE_NAME_TAKEN', 'A role with this name already exists.')
  }
}

function validatePermissions(input: unknown) {
  if (input === undefined) return undefined
  if (!Array.isArray(input)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Permissions must be an array.')
  }
  const permissions = [...new Set(input)]
  if (permissions.some((permission) => !ALL_PERMISSION_CODES.includes(permission))) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Unknown permission code.')
  }
  return permissions as string[]
}

export const roleHandlers = [
  http.get(`${API}/roles/options`, ({ request }) =>
    run(() => {
      const db = readDb()
      authorize(db, request, PERMISSION_CODES.userRead)
      return db.roles.map((role) => ({ id: role.id, name: role.name }))
    }),
  ),

  http.get(`${API}/roles`, ({ request }) =>
    run(() => {
      const db = readDb()
      authorize(db, request, PERMISSION_CODES.roleRead)
      return db.roles.map((role) => serializeRole(db, role))
    }),
  ),

  http.post(`${API}/roles`, ({ request }) =>
    run(async () => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.roleCreate)
      const body = (await readJson<RoleBody & PermissionsBody>(request)) ?? {}
      const name = validateRoleName(body.name)
      const description = validateDescription(body.description) ?? ''
      const permissions = validatePermissions(body.permissions) ?? []
      ensureNameAvailable(db, name)

      const record: MockRoleRecord = {
        id: `role-${crypto.randomUUID()}`,
        name,
        description,
        permissions,
        isSystem: false,
      }

      db.roles.push(record)
      logAuditEvent(db, {
        action: 'role.created',
        actorId: actor.user.id,
        actorName: actor.user.name,
        entityType: 'role',
        entityId: record.id,
        entityLabel: record.name,
        metadata: { permissions: String(permissions.length) },
      })
      writeDb(db)
      return serializeRole(db, record)
    }),
  ),

  http.patch(`${API}/roles/:id`, ({ request, params }) =>
    run(async () => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.roleUpdate)
      const role = findRole(db, String(params.id))
      if (!role) throw new HttpError(404, 'ROLE_NOT_FOUND', 'Role not found.')
      if (role.isSystem) {
        throw new HttpError(400, 'PROTECTED_ROLE', 'System roles cannot be renamed.')
      }

      const body = (await readJson<RoleBody>(request)) ?? {}
      const metadata: Record<string, string> = {}

      if (body.name !== undefined) {
        const name = validateRoleName(body.name)
        ensureNameAvailable(db, name, role.id)
        if (name !== role.name) {
          metadata.previousName = role.name
          role.name = name
        }
      }

      if (body.description !== undefined) {
        const description = validateDescription(body.description) ?? ''
        if (description !== role.description) {
          role.description = description
          metadata.field = 'description'
        }
      }

      logActivity(db, 'role.updated', actor.user.name, role.name, {
        actorId: actor.user.id,
        entityType: 'role',
        entityId: role.id,
        metadata,
      })
      writeDb(db)
      return serializeRole(db, role)
    }),
  ),

  http.delete(`${API}/roles/:id`, ({ request, params }) =>
    runNoContent(() => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.roleDelete)
      const role = findRole(db, String(params.id))
      if (!role) throw new HttpError(404, 'ROLE_NOT_FOUND', 'Role not found.')
      if (role.isSystem) {
        throw new HttpError(400, 'PROTECTED_ROLE', 'System roles cannot be deleted.')
      }

      const userCount = db.users.filter((user) => user.roleId === role.id && !user.deletedAt).length
      if (userCount > 0) {
        throw new HttpError(409, 'ROLE_IN_USE', 'Move members to another role before deleting.')
      }

      db.roles = db.roles.filter((item) => item.id !== role.id)
      logAuditEvent(db, {
        action: 'role.deleted',
        actorId: actor.user.id,
        actorName: actor.user.name,
        entityType: 'role',
        entityId: role.id,
        entityLabel: role.name,
      })
      writeDb(db)
    }),
  ),

  http.put(`${API}/roles/:id/permissions`, ({ request, params }) =>
    run(async () => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.roleUpdate)
      const role = findRole(db, String(params.id))
      if (!role) throw new HttpError(404, 'ROLE_NOT_FOUND', 'Role not found.')
      if (role.isSystem && role.permissions.includes('*')) {
        throw new HttpError(400, 'PROTECTED_ROLE', 'The admin role always has every permission.')
      }

      const body = (await readJson<PermissionsBody>(request)) ?? {}
      const permissions = validatePermissions(body.permissions)
      if (!permissions) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Permissions must be an array.')
      }

      const previous = role.permissions.length
      role.permissions = permissions
      logActivity(db, 'role.updated', actor.user.name, role.name, {
        actorId: actor.user.id,
        entityType: 'role',
        entityId: role.id,
        metadata: { permissions: `${previous} → ${permissions.length}` },
      })
      writeDb(db)
      return serializeRole(db, role)
    }),
  ),

  http.get(`${API}/permissions`, ({ request }) =>
    run(() => {
      const db = readDb()
      authorize(db, request, PERMISSION_CODES.permissionRead)
      return PERMISSIONS
    }),
  ),
]
