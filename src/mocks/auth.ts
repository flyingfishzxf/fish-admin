import { DEMO_MFA_CODE } from '@/config/demo'
import { hasPermission } from '@/lib/permissions'

import { findRole, findUserById } from './db/store'
import type {
  MockDb,
  MockMfaChallenge,
  MockRoleRecord,
  MockSession,
  MockUserRecord,
} from './db/types'
import { HttpError } from './http'
import {
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
  createAccessToken,
  createRefreshToken,
  decodeAccessToken,
} from './jwt'

export const MAX_LOGIN_ATTEMPTS = 5
export const LOGIN_LOCKOUT_MS = 60_000
export const MFA_CHALLENGE_TTL = 5 * 60_000
export const VERIFICATION_TOKEN_TTL = 24 * 60 * 60_000
export const PASSWORD_RESET_TTL = 30 * 60_000

export interface AuthenticatedActor {
  user: MockUserRecord
  role: MockRoleRecord
  permissions: string[]
  session: MockSession
}

export function authenticate(db: MockDb, request: Request): AuthenticatedActor {
  const header = request.headers.get('Authorization')
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) throw new HttpError(401, 'UNAUTHORIZED', 'Authentication required.')

  const payload = decodeAccessToken(token)
  if (!payload) throw new HttpError(401, 'UNAUTHORIZED', 'Invalid access token.')
  if (payload.exp <= Date.now()) {
    throw new HttpError(401, 'TOKEN_EXPIRED', 'Access token has expired.')
  }

  const session = db.sessions.find((item) => item.id === payload.sid && item.userId === payload.sub)
  if (!session) {
    throw new HttpError(401, 'SESSION_REVOKED', 'This session is no longer active.')
  }
  if (session.expiresAt <= Date.now()) {
    throw new HttpError(401, 'SESSION_EXPIRED', 'This session has expired.')
  }

  const user = findUserById(db, payload.sub)
  if (!user || user.deletedAt) {
    throw new HttpError(401, 'UNAUTHORIZED', 'User no longer exists.')
  }
  if (user.status === 'inactive') {
    throw new HttpError(401, 'ACCOUNT_INACTIVE', 'This account is inactive.')
  }

  const role = findRole(db, user.roleId)
  if (!role) throw new HttpError(401, 'UNAUTHORIZED', 'Assigned role no longer exists.')

  return { user, role, permissions: role.permissions, session }
}

export function authorize(db: MockDb, request: Request, permission: string) {
  const actor = authenticate(db, request)
  if (!hasPermission(actor.permissions, permission)) {
    throw new HttpError(403, 'FORBIDDEN', `Missing permission: ${permission}`)
  }
  return actor
}

function createSession(db: MockDb, user: MockUserRecord, request?: Request): MockSession {
  const now = Date.now()
  db.sessions = db.sessions.filter((session) => session.expiresAt > now)

  const session: MockSession = {
    id: `session-${crypto.randomUUID()}`,
    userId: user.id,
    refreshToken: createRefreshToken(),
    createdAt: now,
    lastActiveAt: now,
    expiresAt: now + REFRESH_TOKEN_TTL,
    userAgent: request?.headers.get('user-agent') ?? 'Unknown client',
    ip: '127.0.0.1',
  }
  db.sessions.push(session)
  return session
}

export function issueAccessToken(user: MockUserRecord, session: MockSession) {
  return createAccessToken(user.id, user.roleId, session.id, ACCESS_TOKEN_TTL)
}

export function issueTokens(db: MockDb, user: MockUserRecord, request?: Request) {
  const session = createSession(db, user, request)
  return {
    accessToken: issueAccessToken(user, session),
    refreshToken: session.refreshToken,
  }
}

export function rotateSession(session: MockSession) {
  session.refreshToken = createRefreshToken()
  session.lastActiveAt = Date.now()
  session.expiresAt = Date.now() + REFRESH_TOKEN_TTL
  return session
}

export function revokeSession(db: MockDb, sessionId: string) {
  db.sessions = db.sessions.filter((session) => session.id !== sessionId)
}

export function revokeSessionsForUser(db: MockDb, userId: string, exceptSessionId?: string) {
  db.sessions = db.sessions.filter(
    (session) => session.userId !== userId || session.id === exceptSessionId,
  )
}

export function createMfaChallenge(db: MockDb, user: MockUserRecord): MockMfaChallenge {
  const now = Date.now()
  for (const [id, challenge] of Object.entries(db.mfaChallenges)) {
    if (challenge.expiresAt <= now) delete db.mfaChallenges[id]
  }

  const challenge: MockMfaChallenge = {
    id: `mfa-${crypto.randomUUID()}`,
    userId: user.id,
    code: DEMO_MFA_CODE,
    expiresAt: now + MFA_CHALLENGE_TTL,
    attempts: 0,
  }
  db.mfaChallenges[challenge.id] = challenge
  return challenge
}
