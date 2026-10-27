import { faker } from '@faker-js/faker'

import type { UserStatus } from '@/types'

import type { MockDb, MockUserRecord } from './types'

export const SYNTHETIC_USER_COUNT = 5000
const SYNTHETIC_PREFIX = 'user-synth-'
const STATUS_PATTERN: UserStatus[] = ['active', 'active', 'active', 'invited', 'inactive']

let records: MockUserRecord[] | null = null

/**
 * Demo volume lives in memory only: 5 000 rows would bloat localStorage and the seeded database,
 * and the regular list must keep reflecting stored users.
 */
export function syntheticUserRecords(db: MockDb): MockUserRecord[] {
  if (records) return records

  faker.seed(5000)
  const departments = db.departments.filter((department) => department.parentId !== null)
  const pool = departments.length > 0 ? departments : db.departments
  const roles = db.roles
  const now = Date.now()
  const names = new Set<string>()

  records = Array.from({ length: SYNTHETIC_USER_COUNT }, (_, index) => {
    let name = faker.person.fullName()
    while (names.has(name)) name = faker.person.fullName()
    names.add(name)

    const department = pool[index % pool.length]
    const role = roles[index % roles.length]
    const createdAt = new Date(now - (index * 5 + 12) * 60 * 60 * 1000)

    return {
      id: `${SYNTHETIC_PREFIX}${String(index + 1).padStart(4, '0')}`,
      name,
      email: `demo.${String(index + 1).padStart(4, '0')}@example.com`,
      password: 'Password123!',
      roleId: role?.id ?? 'viewer',
      status: STATUS_PATTERN[index % STATUS_PATTERN.length],
      department: department?.name ?? 'General',
      departmentId: department?.id,
      tags: index % 7 === 0 ? ['demo'] : [],
      emailVerified: index % 5 !== 3,
      twoFactorEnabled: index % 11 === 0,
      createdAt: createdAt.toISOString(),
      lastActiveAt: new Date(createdAt.getTime() + (index % 48) * 60 * 60 * 1000).toISOString(),
    }
  })

  return records
}

export function isSyntheticUserId(id: string) {
  return id.startsWith(SYNTHETIC_PREFIX)
}

export function updateSyntheticUserStatus(ids: string[], status: UserStatus): string[] {
  if (!records) return []
  const wanted = new Set(ids)
  const updated: string[] = []

  for (const record of records) {
    if (!wanted.has(record.id) || record.status === status) continue
    record.status = status
    updated.push(record.id)
  }

  return updated
}

export function deleteSyntheticUsers(ids: string[]): string[] {
  if (!records) return []
  const wanted = new Set(ids)
  const deleted: string[] = []
  const now = new Date().toISOString()

  for (const record of records) {
    if (!wanted.has(record.id) || record.deletedAt) continue
    record.deletedAt = now
    deleted.push(record.id)
  }

  return deleted
}

export function restoreSyntheticUsers(ids: string[]): MockUserRecord[] {
  if (!records) return []
  const wanted = new Set(ids)
  const restored: MockUserRecord[] = []

  for (const record of records) {
    if (!wanted.has(record.id) || !record.deletedAt) continue
    record.deletedAt = undefined
    restored.push(record)
  }

  return restored
}
