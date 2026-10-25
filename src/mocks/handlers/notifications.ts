import { http } from 'msw'

import { env } from '@/config/env'
import type {
  NotificationFilter,
  NotificationPreferences,
  PaginatedResult,
  WorkspaceNotification,
} from '@/types'

import { authenticate } from '../auth'
import { readDb, writeDb } from '../db/store'
import type { MockDb } from '../db/types'
import { HttpError, readJson, run } from '../http'

const API = env.apiBaseUrl
const FILTERS: NotificationFilter[] = ['all', 'unread', 'mention']
const DIGESTS: NotificationPreferences['digest'][] = ['off', 'daily', 'weekly']
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/

const DEFAULT_PREFERENCES: NotificationPreferences = {
  quietStart: '22:00',
  quietEnd: '08:00',
  digest: 'daily',
  channels: { inApp: true, email: true, push: false },
}

function currentUser(db: MockDb, request: Request) {
  return authenticate(db, request).user
}

function serializePreferences(db: MockDb, userId: string): NotificationPreferences {
  const stored = db.notificationPreferences[userId]
  return {
    ...DEFAULT_PREFERENCES,
    ...stored,
    channels: { ...DEFAULT_PREFERENCES.channels, ...stored?.channels },
  }
}

function readTime(value: unknown, field: string) {
  if (typeof value !== 'string' || !TIME_PATTERN.test(value)) {
    throw new HttpError(400, 'VALIDATION_ERROR', `${field} must use the HH:mm format.`)
  }
  return value
}

function readDigest(value: unknown): NotificationPreferences['digest'] {
  if (!DIGESTS.includes(value as NotificationPreferences['digest'])) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Unknown digest frequency.')
  }
  return value as NotificationPreferences['digest']
}

function readChannels(value: unknown) {
  if (!value || typeof value !== 'object') {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Channels must be an object.')
  }
  const channels = value as Record<string, unknown>
  return {
    inApp: channels.inApp === true,
    email: channels.email === true,
    push: channels.push === true,
  }
}

export const notificationHandlers = [
  http.get(`${API}/notifications`, ({ request }) =>
    run((): PaginatedResult<WorkspaceNotification> & { unreadCount: number } => {
      const db = readDb()
      const user = currentUser(db, request)
      const url = new URL(request.url)
      const filter = FILTERS.includes(url.searchParams.get('filter') as NotificationFilter)
        ? (url.searchParams.get('filter') as NotificationFilter)
        : 'all'

      const mine = db.notifications
        .filter((item) => item.userId === user.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      const unreadCount = mine.filter((item) => !item.read).length
      const filtered = mine.filter((item) => {
        if (filter === 'unread') return !item.read
        if (filter === 'mention') return item.kind === 'mention'
        return true
      })

      const pageSize = Math.min(Math.max(Number(url.searchParams.get('pageSize') ?? 10), 5), 50)
      const total = filtered.length
      const pageCount = Math.max(1, Math.ceil(total / pageSize))
      const page = Math.min(Math.max(Number(url.searchParams.get('page') ?? 1), 1), pageCount)
      const start = (page - 1) * pageSize

      return {
        items: filtered.slice(start, start + pageSize),
        total,
        page,
        pageSize,
        pageCount,
        unreadCount,
      }
    }),
  ),

  http.get(`${API}/notifications/preferences`, ({ request }) =>
    run(() => {
      const db = readDb()
      const user = currentUser(db, request)
      return serializePreferences(db, user.id)
    }),
  ),

  http.get(`${API}/notifications/:id`, ({ request, params }) =>
    run(() => {
      const db = readDb()
      const user = currentUser(db, request)
      const notification = db.notifications.find(
        (item) => item.id === String(params.id) && item.userId === user.id,
      )
      if (!notification) {
        throw new HttpError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found.')
      }
      return notification
    }),
  ),

  http.patch(`${API}/notifications/:id`, async ({ request, params }) => {
    const body = await readJson<{ read?: unknown }>(request)
    return run(() => {
      const db = readDb()
      const user = currentUser(db, request)
      const notification = db.notifications.find(
        (item) => item.id === String(params.id) && item.userId === user.id,
      )
      if (!notification) {
        throw new HttpError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found.')
      }
      if (typeof body?.read !== 'boolean') {
        throw new HttpError(400, 'VALIDATION_ERROR', 'read must be a boolean.')
      }

      notification.read = body.read
      writeDb(db)
      return notification
    })
  }),

  http.post(`${API}/notifications/read`, async ({ request }) => {
    const body = await readJson<{ ids?: unknown }>(request)
    return run(() => {
      const db = readDb()
      const user = currentUser(db, request)
      const ids = Array.isArray(body?.ids)
        ? body.ids.filter((id): id is string => typeof id === 'string')
        : []
      if (ids.length === 0) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Choose at least one notification.')
      }

      const targets = new Set(ids)
      let updated = 0
      for (const notification of db.notifications) {
        if (notification.userId !== user.id || !targets.has(notification.id)) continue
        if (!notification.read) {
          notification.read = true
          updated += 1
        }
      }
      writeDb(db)
      return { updated }
    })
  }),

  http.post(`${API}/notifications/read-all`, ({ request }) =>
    run(() => {
      const db = readDb()
      const user = currentUser(db, request)
      let updated = 0
      for (const notification of db.notifications) {
        if (notification.userId === user.id && !notification.read) {
          notification.read = true
          updated += 1
        }
      }
      writeDb(db)
      return { updated }
    }),
  ),

  http.get(`${API}/notifications/preferences`, ({ request }) =>
    run(() => {
      const db = readDb()
      const user = currentUser(db, request)
      return serializePreferences(db, user.id)
    }),
  ),

  http.put(`${API}/notifications/preferences`, async ({ request }) => {
    const body = await readJson<Partial<NotificationPreferences>>(request)
    return run(() => {
      const db = readDb()
      const user = currentUser(db, request)
      if (!body) throw new HttpError(400, 'VALIDATION_ERROR', 'Preferences are required.')

      const preferences: NotificationPreferences = {
        quietStart: readTime(body.quietStart, 'quietStart'),
        quietEnd: readTime(body.quietEnd, 'quietEnd'),
        digest: readDigest(body.digest),
        channels: readChannels(body.channels),
      }

      db.notificationPreferences[user.id] = preferences
      writeDb(db)
      return preferences
    })
  }),
]
