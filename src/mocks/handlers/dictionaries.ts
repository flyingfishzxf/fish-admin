import { http } from 'msw'

import { env } from '@/config/env'
import { PERMISSION_CODES } from '@/config/permissions'
import type { DictionaryDetail, DictionaryItem, DictionaryType } from '@/types'

import { authorize } from '../auth'
import { logAuditEvent, readDb, writeDb } from '../db/store'
import type { MockDb, MockDictionaryItemRecord, MockDictionaryTypeRecord } from '../db/types'
import { HttpError, readJson, run, runNoContent } from '../http'

const API = env.apiBaseUrl
const CODE_PATTERN = /^[a-z][a-z0-9_]{1,31}$/
const VALUE_PATTERN = /^[a-z0-9][a-z0-9_-]{0,31}$/

interface DictionaryBody {
  code?: unknown
  name?: unknown
  description?: unknown
}

interface ItemBody {
  label?: unknown
  value?: unknown
  description?: unknown
  enabled?: unknown
}

function notFound() {
  return new HttpError(404, 'DICTIONARY_NOT_FOUND', 'Dictionary not found.')
}

function findType(db: MockDb, idOrCode: string) {
  const type = db.dictionaryTypes.find((entry) => entry.id === idOrCode || entry.code === idOrCode)
  if (!type) throw notFound()
  return type
}

function itemsOf(db: MockDb, typeId: string) {
  return db.dictionaryItems
    .filter((item) => item.dictionaryId === typeId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label))
}

/**
 * Reference counts are what makes the dictionary safe to edit. Only the user tag
 * dictionary is wired into a screen today; a real backend should resolve every
 * type it owns instead of returning zero.
 */
function countReferences(
  db: MockDb,
  type: MockDictionaryTypeRecord,
  item: MockDictionaryItemRecord,
) {
  if (type.code !== 'user_tag') return 0
  return db.users.filter((user) => !user.deletedAt && user.tags.includes(item.value)).length
}

function serializeItem(
  db: MockDb,
  type: MockDictionaryTypeRecord,
  item: MockDictionaryItemRecord,
): DictionaryItem {
  return { ...item, referenceCount: countReferences(db, type, item) }
}

function serializeType(db: MockDb, type: MockDictionaryTypeRecord): DictionaryType {
  const items = itemsOf(db, type.id)
  return {
    ...type,
    itemCount: items.length,
    referenceCount: items.reduce((total, item) => total + countReferences(db, type, item), 0),
  }
}

function serializeDetail(db: MockDb, type: MockDictionaryTypeRecord): DictionaryDetail {
  return {
    dictionary: serializeType(db, type),
    items: itemsOf(db, type.id).map((item) => serializeItem(db, type, item)),
  }
}

function readString(value: unknown, field: string, max: number) {
  if (typeof value !== 'string') {
    throw new HttpError(400, 'VALIDATION_ERROR', `${field} is required.`)
  }
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > max) {
    throw new HttpError(400, 'VALIDATION_ERROR', `${field} must be 1-${max} characters.`)
  }
  return trimmed
}

function readOptionalDescription(value: unknown) {
  if (value === undefined) return undefined
  if (typeof value !== 'string' || value.length > 200) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Description must be at most 200 characters.')
  }
  return value.trim()
}

function logDictionaryAudit(
  db: MockDb,
  action: 'dictionary.created' | 'dictionary.updated' | 'dictionary.deleted',
  type: MockDictionaryTypeRecord,
  actor: { id: string; name: string },
  metadata: Record<string, string> = {},
) {
  logAuditEvent(db, {
    action,
    actorId: actor.id,
    actorName: actor.name,
    entityType: 'dictionary',
    entityId: type.id,
    entityLabel: type.name,
    metadata,
  })
}

export const dictionaryHandlers = [
  http.get(`${API}/dictionaries`, ({ request }) =>
    run((): DictionaryType[] => {
      const db = readDb()
      authorize(db, request, PERMISSION_CODES.dictionaryRead)

      return [...db.dictionaryTypes]
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.name.localeCompare(b.name))
        .map((type) => serializeType(db, type))
    }),
  ),

  http.post(`${API}/dictionaries`, ({ request }) =>
    run(async (): Promise<DictionaryDetail> => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.dictionaryManage)
      const body = await readJson<DictionaryBody>(request)

      const code = readString(body?.code, 'Code', 32)
      if (!CODE_PATTERN.test(code)) {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          'Code must start with a letter and use lowercase letters, digits or underscores.',
        )
      }
      if (db.dictionaryTypes.some((type) => type.code.toLowerCase() === code.toLowerCase())) {
        throw new HttpError(409, 'DICTIONARY_CODE_TAKEN', 'This code is already in use.')
      }

      const now = new Date().toISOString()
      const type: MockDictionaryTypeRecord = {
        id: `dict-${crypto.randomUUID()}`,
        code,
        name: readString(body?.name, 'Name', 48),
        description: readOptionalDescription(body?.description) ?? '',
        isSystem: false,
        createdAt: now,
        updatedAt: now,
      }

      db.dictionaryTypes.push(type)
      logDictionaryAudit(db, 'dictionary.created', type, actor.user, { code })
      writeDb(db)
      return serializeDetail(db, type)
    }),
  ),

  http.get(`${API}/dictionaries/:id`, ({ request, params }) =>
    run((): DictionaryDetail => {
      const db = readDb()
      authorize(db, request, PERMISSION_CODES.dictionaryRead)
      return serializeDetail(db, findType(db, String(params.id)))
    }),
  ),

  http.patch(`${API}/dictionaries/:id`, ({ request, params }) =>
    run(async (): Promise<DictionaryDetail> => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.dictionaryManage)
      const type = findType(db, String(params.id))
      const body = await readJson<DictionaryBody>(request)

      if (body?.name !== undefined) type.name = readString(body.name, 'Name', 48)
      const description = readOptionalDescription(body?.description)
      if (description !== undefined) type.description = description
      type.updatedAt = new Date().toISOString()

      logDictionaryAudit(db, 'dictionary.updated', type, actor.user)
      writeDb(db)
      return serializeDetail(db, type)
    }),
  ),

  http.delete(`${API}/dictionaries/:id`, ({ request, params }) =>
    runNoContent(() => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.dictionaryManage)
      const type = findType(db, String(params.id))

      if (type.isSystem) {
        throw new HttpError(409, 'DICTIONARY_PROTECTED', 'Seeded dictionaries cannot be deleted.')
      }
      if (db.dictionaryItems.some((item) => item.dictionaryId === type.id)) {
        throw new HttpError(409, 'DICTIONARY_NOT_EMPTY', 'Delete the items first.')
      }

      db.dictionaryTypes = db.dictionaryTypes.filter((entry) => entry.id !== type.id)
      logDictionaryAudit(db, 'dictionary.deleted', type, actor.user)
      writeDb(db)
    }),
  ),

  http.post(`${API}/dictionaries/:id/items`, ({ request, params }) =>
    run(async (): Promise<DictionaryDetail> => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.dictionaryManage)
      const type = findType(db, String(params.id))
      const body = await readJson<ItemBody>(request)

      const value = readString(body?.value, 'Value', 32)
      if (!VALUE_PATTERN.test(value)) {
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          'Value must use lowercase letters, digits, dashes or underscores.',
        )
      }
      const items = itemsOf(db, type.id)
      if (items.some((item) => item.value.toLowerCase() === value.toLowerCase())) {
        throw new HttpError(409, 'ITEM_VALUE_TAKEN', 'This value is already in use.')
      }

      const label = readString(body?.label, 'Label', 40)
      if (items.some((item) => item.label.toLowerCase() === label.toLowerCase())) {
        throw new HttpError(409, 'ITEM_LABEL_TAKEN', 'This label is already in use.')
      }

      const now = new Date().toISOString()
      const item: MockDictionaryItemRecord = {
        id: `dict-item-${crypto.randomUUID()}`,
        dictionaryId: type.id,
        label,
        value,
        description: readOptionalDescription(body?.description) ?? '',
        sortOrder: items.length,
        enabled: true,
        isSystem: false,
        createdAt: now,
        updatedAt: now,
      }

      db.dictionaryItems.push(item)
      type.updatedAt = now
      logDictionaryAudit(db, 'dictionary.updated', type, actor.user, { item: label })
      writeDb(db)
      return serializeDetail(db, type)
    }),
  ),

  http.patch(`${API}/dictionaries/:id/items/reorder`, ({ request, params }) =>
    run(async (): Promise<DictionaryDetail> => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.dictionaryManage)
      const type = findType(db, String(params.id))
      const body = await readJson<{ ids?: unknown }>(request)

      const ids = Array.isArray(body?.ids) ? body.ids.filter((id) => typeof id === 'string') : []
      const items = itemsOf(db, type.id)
      const current = new Set(items.map((item) => item.id))
      if (
        ids.length !== items.length ||
        new Set(ids).size !== ids.length ||
        ids.some((id) => !current.has(id))
      ) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Order must list every item exactly once.')
      }

      const now = new Date().toISOString()
      ids.forEach((id, index) => {
        const item = items.find((entry) => entry.id === id)
        if (!item) return
        item.sortOrder = index
        item.updatedAt = now
      })
      type.updatedAt = now
      logDictionaryAudit(db, 'dictionary.updated', type, actor.user, { reordered: 'true' })
      writeDb(db)
      return serializeDetail(db, type)
    }),
  ),

  http.patch(`${API}/dictionaries/:id/items/:itemId`, ({ request, params }) =>
    run(async (): Promise<DictionaryDetail> => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.dictionaryManage)
      const type = findType(db, String(params.id))
      const item = db.dictionaryItems.find(
        (entry) => entry.id === params.itemId && entry.dictionaryId === type.id,
      )
      if (!item) throw new HttpError(404, 'ITEM_NOT_FOUND', 'Dictionary item not found.')
      const body = await readJson<ItemBody>(request)

      const siblings = itemsOf(db, type.id).filter((entry) => entry.id !== item.id)
      const referenced = countReferences(db, type, item) > 0

      if (body?.value !== undefined) {
        if (referenced) {
          throw new HttpError(
            409,
            'ITEM_IN_USE',
            'The value is referenced elsewhere; disable the item or change other records first.',
          )
        }
        const value = readString(body.value, 'Value', 32)
        if (!VALUE_PATTERN.test(value)) {
          throw new HttpError(
            400,
            'VALIDATION_ERROR',
            'Value must use lowercase letters, digits, dashes or underscores.',
          )
        }
        if (siblings.some((entry) => entry.value.toLowerCase() === value.toLowerCase())) {
          throw new HttpError(409, 'ITEM_VALUE_TAKEN', 'This value is already in use.')
        }
        item.value = value
      }

      if (body?.label !== undefined) {
        const label = readString(body.label, 'Label', 40)
        if (siblings.some((entry) => entry.label.toLowerCase() === label.toLowerCase())) {
          throw new HttpError(409, 'ITEM_LABEL_TAKEN', 'This label is already in use.')
        }
        item.label = label
      }

      const description = readOptionalDescription(body?.description)
      if (description !== undefined) item.description = description
      if (body?.enabled !== undefined) item.enabled = Boolean(body.enabled)

      item.updatedAt = new Date().toISOString()
      type.updatedAt = item.updatedAt
      logDictionaryAudit(db, 'dictionary.updated', type, actor.user, { item: item.label })
      writeDb(db)
      return serializeDetail(db, type)
    }),
  ),

  http.delete(`${API}/dictionaries/:id/items/:itemId`, ({ request, params }) =>
    runNoContent(() => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.dictionaryManage)
      const type = findType(db, String(params.id))
      const item = db.dictionaryItems.find(
        (entry) => entry.id === params.itemId && entry.dictionaryId === type.id,
      )
      if (!item) throw new HttpError(404, 'ITEM_NOT_FOUND', 'Dictionary item not found.')
      if (item.isSystem) {
        throw new HttpError(409, 'ITEM_PROTECTED', 'Seeded items can be disabled, not deleted.')
      }
      if (countReferences(db, type, item) > 0) {
        throw new HttpError(409, 'ITEM_IN_USE', 'This item is still referenced.')
      }

      db.dictionaryItems = db.dictionaryItems.filter((entry) => entry.id !== item.id)
      itemsOf(db, type.id).forEach((entry, index) => {
        entry.sortOrder = index
      })
      type.updatedAt = new Date().toISOString()
      logDictionaryAudit(db, 'dictionary.updated', type, actor.user, { item: item.label })
      writeDb(db)
    }),
  ),
]
