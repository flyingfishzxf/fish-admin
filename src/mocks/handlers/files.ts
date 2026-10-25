import { http } from 'msw'

import { env } from '@/config/env'
import { PERMISSION_CODES } from '@/config/permissions'
import type { FileVisibility, PaginatedResult, WorkspaceFile } from '@/types'

import { authorize } from '../auth'
import { findUserById, logAuditEvent, readDb, writeDb } from '../db/store'
import type { MockDb, MockFileRecord } from '../db/types'
import { HttpError, readJson, run, runNoContent } from '../http'

const API = env.apiBaseUrl
const MAX_DATA_URL = 256_000
const MAX_FILE_SIZE = 50 * 1024 * 1024
const VISIBILITIES: FileVisibility[] = ['team', 'private']
const KINDS = ['all', 'image', 'document', 'data'] as const
const SORTS = ['updatedAt', 'name', 'size'] as const
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

type FileKind = (typeof KINDS)[number]
type FileSort = (typeof SORTS)[number]

interface FileBody {
  name?: string
  mime?: string
  size?: number
  folderId?: string
  visibility?: FileVisibility
  favorite?: boolean
  dataUrl?: string
}

interface BulkDeleteBody {
  ids?: unknown
}

function serializeFile(db: MockDb, file: MockFileRecord): WorkspaceFile {
  return {
    ...file,
    uploadedByName: findUserById(db, file.uploadedById)?.name ?? '—',
  }
}

function kindOf(file: MockFileRecord): Exclude<FileKind, 'all'> {
  if (file.mime.startsWith('image/')) return 'image'
  if (file.mime === 'text/csv' || file.mime === 'application/json') return 'data'
  return 'document'
}

function readName(value: unknown, fallback?: string) {
  if (value === undefined && fallback) return fallback
  if (typeof value !== 'string') {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Name is required.')
  }
  const name = value.trim()
  if (name.length < 1 || name.length > 80) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Name must be 1-80 characters.')
  }
  return name
}

function readFolder(db: MockDb, value: unknown) {
  if (typeof value !== 'string' || !db.fileFolders.some((folder) => folder.id === value)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Choose a valid destination folder.')
  }
  return value
}

function readVisibility(value: unknown): FileVisibility {
  if (!VISIBILITIES.includes(value as FileVisibility)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Unknown file visibility.')
  }
  return value as FileVisibility
}

function readMime(value: unknown) {
  if (value === undefined) return 'application/octet-stream'
  if (typeof value !== 'string' || !value.trim() || value.length > 120) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'File type is invalid.')
  }
  return value.trim()
}

function readSize(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'File size is invalid.')
  }
  if (value > MAX_FILE_SIZE) {
    throw new HttpError(413, 'FILE_TOO_LARGE', 'Files must be 50 MB or smaller.')
  }
  return Math.round(value)
}

function readDataUrl(value: unknown) {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value !== 'string' || !value.startsWith('data:')) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Preview data must be a data URL.')
  }
  if (value.length > MAX_DATA_URL) {
    throw new HttpError(413, 'PREVIEW_TOO_LARGE', 'Preview data must be 256 KB or smaller.')
  }
  return value
}

function findFile(db: MockDb, id: string) {
  const file = db.files.find((entry) => entry.id === id)
  if (!file) throw new HttpError(404, 'FILE_NOT_FOUND', 'File not found.')
  return file
}

function subtreeIds(db: MockDb, id: string) {
  const ids = new Set([id])
  let changed = true
  while (changed) {
    changed = false
    for (const folder of db.fileFolders) {
      if (folder.parentId && ids.has(folder.parentId) && !ids.has(folder.id)) {
        ids.add(folder.id)
        changed = true
      }
    }
  }
  return ids
}

export const fileHandlers = [
  http.get(`${API}/file-folders`, ({ request }) =>
    run(() => {
      const db = readDb()
      authorize(db, request, PERMISSION_CODES.fileRead)

      const folders = db.fileFolders.map((folder) => {
        const ids = subtreeIds(db, folder.id)
        return {
          ...folder,
          fileCount: db.files.filter((file) => ids.has(file.folderId)).length,
        }
      })

      return {
        folders,
        total: db.files.length,
        favorites: db.files.filter((file) => file.favorite).length,
      }
    }),
  ),

  http.get(`${API}/files`, ({ request }) =>
    run((): PaginatedResult<WorkspaceFile> => {
      const db = readDb()
      authorize(db, request, PERMISSION_CODES.fileRead)

      const url = new URL(request.url)
      const folderId = url.searchParams.get('folderId')
      const q = (url.searchParams.get('q') ?? '').trim().toLowerCase()
      const kindParam = url.searchParams.get('kind')
      const visibility = url.searchParams.get('visibility')
      const favorite = url.searchParams.get('favorite') === '1'
      const sortParam = url.searchParams.get('sort')
      const order = url.searchParams.get('order') === 'asc' ? 1 : -1
      const updatedAfter = url.searchParams.get('updatedAfter')

      if (kindParam && !KINDS.includes(kindParam as FileKind)) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Unknown file kind.')
      }
      if (visibility && !VISIBILITIES.includes(visibility as FileVisibility)) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Unknown file visibility.')
      }
      if (sortParam && !SORTS.includes(sortParam as FileSort)) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Unknown sort field.')
      }
      if (updatedAfter && !DAY_PATTERN.test(updatedAfter)) {
        throw new HttpError(400, 'INVALID_DATE', 'Dates must use the yyyy-MM-dd format.')
      }

      const kind = (kindParam as FileKind | null) ?? 'all'
      const sort = (sortParam as FileSort | null) ?? 'updatedAt'
      const afterTime = updatedAfter ? new Date(`${updatedAfter}T00:00:00`).getTime() : null
      const folderScope = folderId ? subtreeIds(db, folderId) : null

      const filtered = db.files.filter((file) => {
        if (folderScope && !folderScope.has(file.folderId)) return false
        if (kind !== 'all' && kindOf(file) !== kind) return false
        if (visibility && file.visibility !== visibility) return false
        if (favorite && !file.favorite) return false
        if (afterTime !== null && new Date(file.updatedAt).getTime() < afterTime) return false
        if (q && !file.name.toLowerCase().includes(q)) return false
        return true
      })

      const sorted = [...filtered].sort((a, b) => {
        if (sort === 'name') return a.name.localeCompare(b.name) * order
        if (sort === 'size') return (a.size - b.size) * order
        return a.updatedAt.localeCompare(b.updatedAt) * order
      })

      const pageSize = Math.min(Math.max(Number(url.searchParams.get('pageSize') ?? 12), 6), 48)
      const total = sorted.length
      const pageCount = Math.max(1, Math.ceil(total / pageSize))
      const page = Math.min(Math.max(Number(url.searchParams.get('page') ?? 1), 1), pageCount)
      const start = (page - 1) * pageSize

      return {
        items: sorted.slice(start, start + pageSize).map((file) => serializeFile(db, file)),
        total,
        page,
        pageSize,
        pageCount,
      }
    }),
  ),

  http.post(`${API}/files/bulk-delete`, ({ request }) =>
    run(async () => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.fileManage)
      const body = (await readJson<BulkDeleteBody>(request)) ?? {}
      const ids = Array.isArray(body.ids)
        ? [...new Set(body.ids.filter((id): id is string => typeof id === 'string'))].slice(0, 100)
        : []
      if (ids.length === 0) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Choose at least one file.')
      }

      const removed = db.files.filter((file) => ids.includes(file.id))
      db.files = db.files.filter((file) => !ids.includes(file.id))
      for (const project of db.projects) {
        project.attachmentIds = project.attachmentIds.filter((id) => !ids.includes(id))
      }
      for (const file of removed) {
        logAuditEvent(db, {
          action: 'file.deleted',
          actorId: actor.user.id,
          actorName: actor.user.name,
          entityType: 'file',
          entityId: file.id,
          entityLabel: file.name,
          metadata: { bulk: 'true' },
        })
      }
      writeDb(db)
      return { deleted: removed.length }
    }),
  ),

  http.post(`${API}/files`, ({ request }) =>
    run(async () => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.fileManage)
      const body = (await readJson<FileBody>(request)) ?? {}

      const record: MockFileRecord = {
        id: `file-${crypto.randomUUID()}`,
        name: readName(body.name),
        folderId: readFolder(db, body.folderId),
        mime: readMime(body.mime),
        size: readSize(body.size),
        dataUrl: readDataUrl(body.dataUrl),
        uploadedById: actor.user.id,
        updatedAt: new Date().toISOString(),
        visibility: body.visibility === undefined ? 'team' : readVisibility(body.visibility),
        favorite: false,
      }

      db.files.unshift(record)
      logAuditEvent(db, {
        action: 'file.uploaded',
        actorId: actor.user.id,
        actorName: actor.user.name,
        entityType: 'file',
        entityId: record.id,
        entityLabel: record.name,
        metadata: { folderId: record.folderId, mime: record.mime },
      })
      writeDb(db)
      return serializeFile(db, record)
    }),
  ),

  http.patch(`${API}/files/:id`, ({ request, params }) =>
    run(async () => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.fileManage)
      const file = findFile(db, String(params.id))
      const body = (await readJson<FileBody>(request)) ?? {}
      const changed: string[] = []

      if (body.name !== undefined) {
        file.name = readName(body.name)
        changed.push('name')
      }
      if (body.folderId !== undefined) {
        file.folderId = readFolder(db, body.folderId)
        changed.push('folderId')
      }
      if (body.visibility !== undefined) {
        file.visibility = readVisibility(body.visibility)
        changed.push('visibility')
      }
      if (body.favorite !== undefined) {
        if (typeof body.favorite !== 'boolean') {
          throw new HttpError(400, 'VALIDATION_ERROR', 'Favorite must be a boolean.')
        }
        file.favorite = body.favorite
        changed.push('favorite')
      }
      if (changed.length === 0) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Nothing to update.')
      }

      file.updatedAt = new Date().toISOString()
      logAuditEvent(db, {
        action: 'file.updated',
        actorId: actor.user.id,
        actorName: actor.user.name,
        entityType: 'file',
        entityId: file.id,
        entityLabel: file.name,
        metadata: { fields: changed.join(','), folderId: file.folderId },
      })
      writeDb(db)
      return serializeFile(db, file)
    }),
  ),

  http.delete(`${API}/files/:id`, ({ request, params }) =>
    runNoContent(() => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.fileManage)
      const file = findFile(db, String(params.id))

      db.files = db.files.filter((entry) => entry.id !== file.id)
      for (const project of db.projects) {
        project.attachmentIds = project.attachmentIds.filter((id) => id !== file.id)
      }
      logAuditEvent(db, {
        action: 'file.deleted',
        actorId: actor.user.id,
        actorName: actor.user.name,
        entityType: 'file',
        entityId: file.id,
        entityLabel: file.name,
      })
      writeDb(db)
    }),
  ),
]
