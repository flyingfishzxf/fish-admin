import { http } from 'msw'

import { env } from '@/config/env'
import { PERMISSION_CODES } from '@/config/permissions'

import { authorize } from '../auth'
import {
  departmentSubtreeIds,
  findDepartment,
  findDepartmentByName,
  logAuditEvent,
  readDb,
  serializeDepartment,
  writeDb,
} from '../db/store'
import type { MockDb, MockDepartmentRecord } from '../db/types'
import { HttpError, readJson, run } from '../http'

const API = env.apiBaseUrl

interface DepartmentBody {
  name?: string
  parentId?: string | null
}

function validateName(name: string | undefined) {
  const trimmed = name?.trim()
  if (!trimmed || trimmed.length < 2 || trimmed.length > 40) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Department name must be 2–40 characters.')
  }
  return trimmed
}

function orderedDepartments(db: MockDb) {
  const seen = new Set<string>()
  const result: MockDepartmentRecord[] = []

  const walk = (parentId: string | null) => {
    const siblings = db.departments
      .filter((department) => department.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))

    for (const sibling of siblings) {
      if (seen.has(sibling.id)) continue
      seen.add(sibling.id)
      result.push(sibling)
      walk(sibling.id)
    }
  }

  walk(null)

  // Cycles and records with a missing parent stay visible instead of disappearing.
  for (const department of db.departments) {
    if (!seen.has(department.id)) {
      seen.add(department.id)
      result.push(department)
    }
  }

  return result
}

function nextSortOrder(db: MockDb, parentId: string | null) {
  const siblings = db.departments.filter((department) => department.parentId === parentId)
  return siblings.reduce((max, department) => Math.max(max, department.sortOrder), 0) + 1
}

function ensureNameAvailable(db: MockDb, name: string, currentId?: string) {
  const existing = findDepartmentByName(db, name)
  if (existing && existing.id !== currentId) {
    throw new HttpError(409, 'DEPARTMENT_NAME_TAKEN', 'This department name is already in use.')
  }
}

export const departmentHandlers = [
  http.get(`${API}/departments`, ({ request }) =>
    run(() => {
      const db = readDb()
      authorize(db, request, PERMISSION_CODES.departmentRead)
      return {
        items: orderedDepartments(db).map((department) => serializeDepartment(db, department)),
      }
    }),
  ),

  http.post(`${API}/departments`, ({ request }) =>
    run(async () => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.departmentManage)
      const body = (await readJson<DepartmentBody>(request)) ?? {}
      const name = validateName(body.name)
      const parentId = body.parentId ?? null

      if (parentId !== null && !findDepartment(db, parentId)) {
        throw new HttpError(400, 'INVALID_PARENT', 'Parent department does not exist.')
      }
      ensureNameAvailable(db, name)

      const record: MockDepartmentRecord = {
        id: `dept-${crypto.randomUUID()}`,
        name,
        parentId,
        sortOrder: nextSortOrder(db, parentId),
        createdAt: new Date().toISOString(),
      }

      db.departments.push(record)
      logAuditEvent(db, {
        action: 'department.created',
        actorId: actor.user.id,
        actorName: actor.user.name,
        entityType: 'department',
        entityId: record.id,
        entityLabel: record.name,
        metadata: { parentId: parentId ?? 'root' },
      })
      writeDb(db)
      return serializeDepartment(db, record)
    }),
  ),

  http.patch(`${API}/departments/:id`, ({ request, params }) =>
    run(async () => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.departmentManage)
      const department = findDepartment(db, String(params.id))
      if (!department) {
        throw new HttpError(404, 'DEPARTMENT_NOT_FOUND', 'Department not found.')
      }

      const body = (await readJson<DepartmentBody>(request)) ?? {}
      const metadata: Record<string, string> = {}

      if (body.name !== undefined) {
        const name = validateName(body.name)
        ensureNameAvailable(db, name, department.id)
        if (name !== department.name) {
          metadata.previousName = department.name
          department.name = name
          for (const user of db.users) {
            if (user.departmentId === department.id) user.department = name
          }
        }
      }

      if (body.parentId !== undefined) {
        const parentId = body.parentId
        if (parentId !== null) {
          if (!findDepartment(db, parentId)) {
            throw new HttpError(400, 'INVALID_PARENT', 'Parent department does not exist.')
          }
          if (departmentSubtreeIds(db, department.id).has(parentId)) {
            throw new HttpError(400, 'INVALID_PARENT', 'A department cannot move inside itself.')
          }
        }
        if (parentId !== department.parentId) {
          metadata.previousParentId = department.parentId ?? 'root'
          department.parentId = parentId
          department.sortOrder = nextSortOrder(db, parentId)
        }
      }

      logAuditEvent(db, {
        action: 'department.updated',
        actorId: actor.user.id,
        actorName: actor.user.name,
        entityType: 'department',
        entityId: department.id,
        entityLabel: department.name,
        metadata,
      })
      writeDb(db)
      return serializeDepartment(db, department)
    }),
  ),
]
