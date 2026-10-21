import { http } from 'msw'

import { env } from '@/config/env'
import { ALL_PERMISSION_CODES, PERMISSION_CODES, PERMISSIONS } from '@/config/permissions'

import { authorize } from '../auth'
import { findRole, logActivity, readDb, serializeRole, writeDb } from '../db/store'
import { HttpError, readJson, run } from '../http'

const API = env.apiBaseUrl

interface PermissionsBody {
  permissions?: unknown
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

  http.put(`${API}/roles/:id/permissions`, ({ request, params }) =>
    run(async () => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.roleUpdate)
      const role = findRole(db, String(params.id))
      if (!role) throw new HttpError(404, 'ROLE_NOT_FOUND', 'Role not found.')
      if (role.id === 'admin' && role.isSystem) {
        throw new HttpError(400, 'PROTECTED_ROLE', 'The admin role always has every permission.')
      }

      const body = (await readJson<PermissionsBody>(request)) ?? {}
      if (!Array.isArray(body.permissions)) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Permissions must be an array.')
      }

      const permissions = [...new Set(body.permissions)]
      if (permissions.some((permission) => !ALL_PERMISSION_CODES.includes(permission))) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Unknown permission code.')
      }

      role.permissions = permissions as string[]
      logActivity(db, 'role.updated', actor.user.name, role.name)
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
