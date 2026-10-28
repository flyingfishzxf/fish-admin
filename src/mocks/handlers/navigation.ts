import { http } from 'msw'

import { env } from '@/config/env'

import { authenticate } from '../auth'
import { readDb } from '../db/store'
import { buildMenuPayload } from '../menu'
import { run } from '../http'

const API = env.apiBaseUrl

export const navigationHandlers = [
  // Reading your own menu takes a session, not a permission: which entries exist
  // is the thing the backend is deciding, and each one carries the permission
  // code the client re-checks against the session.
  http.get(`${API}/menu`, ({ request }) =>
    run(() => {
      const db = readDb()
      authenticate(db, request)
      return buildMenuPayload()
    }),
  ),
]
