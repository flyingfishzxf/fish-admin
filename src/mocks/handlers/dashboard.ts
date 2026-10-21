import { http } from 'msw'

import { env } from '@/config/env'
import { PERMISSION_CODES } from '@/config/permissions'
import type { DashboardRange } from '@/types'

import { authenticate, authorize } from '../auth'
import { logActivity, readDb, resetDb, serializeAuthUser, writeDb } from '../db/store'
import { buildDashboard } from '../dashboard'
import { HttpError, readJson, run } from '../http'

const API = env.apiBaseUrl

interface ProfileBody {
  name?: string
  bio?: string
  avatar?: string | null
}

export const dashboardHandlers = [
  http.get(`${API}/dashboard`, ({ request }) =>
    run(() => {
      const db = readDb()
      authorize(db, request, PERMISSION_CODES.dashboardRead)
      const range: DashboardRange = new URL(request.url).searchParams.get('range') === '30' ? 30 : 7
      return buildDashboard(db, range)
    }),
  ),

  http.patch(`${API}/profile`, ({ request }) =>
    run(async () => {
      const db = readDb()
      const actor = authenticate(db, request)
      const body = (await readJson<ProfileBody>(request)) ?? {}

      if (body.name !== undefined) {
        const name = body.name.trim()
        if (name.length < 2) {
          throw new HttpError(400, 'VALIDATION_ERROR', 'Name must be at least 2 characters.')
        }
        actor.user.name = name
      }

      if (body.bio !== undefined) {
        actor.user.bio = body.bio.trim().slice(0, 280)
      }

      if (body.avatar !== undefined) {
        if (body.avatar === null || body.avatar === '') {
          actor.user.avatar = undefined
        } else if (!body.avatar.startsWith('data:image/') || body.avatar.length > 1_500_000) {
          throw new HttpError(400, 'VALIDATION_ERROR', 'Avatar must be a small image data URL.')
        } else {
          actor.user.avatar = body.avatar
        }
      }

      logActivity(db, 'profile.updated', actor.user.name, actor.user.name)
      writeDb(db)
      return serializeAuthUser(db, actor.user)
    }),
  ),

  http.post(`${API}/__mock/reset`, ({ request }) =>
    run(() => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.demoReset)

      const currentSession = db.sessions.find((session) => session.id === actor.session.id)
      const fresh = resetDb()
      if (currentSession && fresh.users.some((user) => user.id === actor.user.id)) {
        fresh.sessions.push(currentSession)
        writeDb(fresh)
      }

      return { ok: true }
    }),
  ),
]
