import { http } from 'msw'

import { DEMO_MFA_CODE, DEMO_MFA_SECRET } from '@/config/demo'
import { env } from '@/config/env'

import {
  LOGIN_LOCKOUT_MS,
  MAX_LOGIN_ATTEMPTS,
  PASSWORD_RESET_TTL,
  VERIFICATION_TOKEN_TTL,
  authenticate,
  createMfaChallenge,
  issueAccessToken,
  issueTokens,
  revokeSession,
  revokeSessionsForUser,
  rotateSession,
} from '../auth'
import {
  findDepartmentByName,
  findRole,
  findUserByEmail,
  findUserById,
  logActivity,
  readDb,
  serializeAuthUser,
  serializeInvite,
  serializeSession,
  writeDb,
} from '../db/store'
import type { MockDb, MockInvite, MockUserRecord } from '../db/types'
import { HttpError, readJson, run, runNoContent } from '../http'

const API = env.apiBaseUrl
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface LoginBody {
  email?: string
  password?: string
}

interface RefreshBody {
  refreshToken?: string
}

interface MfaVerifyBody {
  challengeId?: string
  code?: string
}

interface RegisterBody {
  name?: string
  email?: string
  password?: string
}

interface TokenBody {
  token?: string
}

interface ForgotPasswordBody {
  email?: string
}

interface ResetPasswordBody {
  token?: string
  password?: string
}

interface AcceptInviteBody extends RegisterBody {
  token?: string
}

interface ChangePasswordBody {
  currentPassword?: string
  newPassword?: string
}

interface TwoFactorEnableBody {
  code?: string
}

interface TwoFactorDisableBody {
  password?: string
}

function requireString(value: string | undefined, code: string, message: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new HttpError(400, code, message)
  }
  return value.trim()
}

function validatePassword(password: string | undefined) {
  if (typeof password !== 'string' || password.length < 8) {
    throw new HttpError(400, 'WEAK_PASSWORD', 'Password must be at least 8 characters.')
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new HttpError(400, 'WEAK_PASSWORD', 'Password must include a letter and a number.')
  }
  return password
}

function validateEmail(email: string | undefined) {
  const value = requireString(email, 'VALIDATION_ERROR', 'Email is required.').toLowerCase()
  if (!EMAIL_PATTERN.test(value)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Enter a valid email address.')
  }
  return value
}

function createToken() {
  return crypto.randomUUID().replace(/-/g, '')
}

function pruneExpiredTokens<T extends { expiresAt: number }>(tokens: T[]): T[] {
  const now = Date.now()
  return tokens.filter((token) => token.expiresAt > now)
}

function findInvite(db: MockDb, token: string): MockInvite {
  const invite = db.invites.find((item) => item.token === token)
  if (!invite) throw new HttpError(404, 'INVITE_NOT_FOUND', 'This invitation does not exist.')
  if (invite.acceptedAt)
    throw new HttpError(410, 'INVITE_USED', 'This invitation was already used.')
  if (new Date(invite.expiresAt).getTime() <= Date.now()) {
    throw new HttpError(410, 'INVITE_EXPIRED', 'This invitation has expired.')
  }
  return invite
}

function createUserRecord(
  db: MockDb,
  input: { name: string; email: string; password: string; roleId: string; department: string },
): MockUserRecord {
  const now = new Date().toISOString()
  const user: MockUserRecord = {
    id: `user-${crypto.randomUUID()}`,
    name: input.name,
    email: input.email,
    password: input.password,
    roleId: input.roleId,
    status: 'active',
    department: input.department,
    departmentId: findDepartmentByName(db, input.department)?.id,
    tags: [],
    emailVerified: true,
    twoFactorEnabled: false,
    createdAt: now,
    lastActiveAt: now,
  }
  db.users.push(user)
  return user
}

function loginResult(db: MockDb, user: MockUserRecord, request: Request) {
  user.lastActiveAt = new Date().toISOString()
  const tokens = issueTokens(db, user, request)
  logActivity(db, 'auth.login', user.name, user.name, {
    actorId: user.id,
    entityType: 'auth',
  })
  writeDb(db)
  return tokens
}

export const authHandlers = [
  http.post(`${API}/auth/login`, ({ request }) =>
    run(async () => {
      const body = await readJson<LoginBody>(request)
      if (!body?.email || !body.password) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Email and password are required.')
      }

      const db = readDb()
      const email = body.email.trim().toLowerCase()
      const now = Date.now()
      const attempts = db.loginAttempts[email]

      if (attempts?.lockedUntil && attempts.lockedUntil > now) {
        const seconds = Math.ceil((attempts.lockedUntil - now) / 1000)
        throw new HttpError(
          429,
          'ACCOUNT_LOCKED',
          `Too many failed attempts. Try again in ${seconds} seconds.`,
        )
      }
      if (attempts?.lockedUntil && attempts.lockedUntil <= now) {
        delete db.loginAttempts[email]
      }

      const user = findUserByEmail(db, email)
      if (!user || user.deletedAt || user.password !== body.password) {
        const record = db.loginAttempts[email] ?? { count: 0, firstAt: now }
        record.count += 1
        if (record.count >= MAX_LOGIN_ATTEMPTS) {
          record.lockedUntil = now + LOGIN_LOCKOUT_MS
          db.loginAttempts[email] = record
          writeDb(db)
          throw new HttpError(
            429,
            'ACCOUNT_LOCKED',
            'Too many failed attempts. This account is locked for one minute.',
          )
        }
        db.loginAttempts[email] = record
        writeDb(db)
        throw new HttpError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password.')
      }

      if (user.status === 'inactive') {
        throw new HttpError(403, 'ACCOUNT_INACTIVE', 'This account is inactive.')
      }
      if (!user.emailVerified) {
        throw new HttpError(
          403,
          'EMAIL_NOT_VERIFIED',
          'Verify your email address before signing in.',
        )
      }

      delete db.loginAttempts[email]

      if (user.twoFactorEnabled) {
        const challenge = createMfaChallenge(db, user)
        writeDb(db)
        return {
          mfaRequired: true as const,
          challengeId: challenge.id,
          expiresAt: new Date(challenge.expiresAt).toISOString(),
        }
      }

      return loginResult(db, user, request)
    }),
  ),

  http.post(`${API}/auth/mfa/verify`, ({ request }) =>
    run(async () => {
      const body = await readJson<MfaVerifyBody>(request)
      if (!body?.challengeId || !body.code) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Challenge and code are required.')
      }

      const db = readDb()
      const challenge = db.mfaChallenges[body.challengeId]
      if (!challenge || challenge.expiresAt <= Date.now()) {
        throw new HttpError(401, 'MFA_EXPIRED', 'This verification code has expired.')
      }

      challenge.attempts += 1
      if (body.code.trim() !== challenge.code) {
        if (challenge.attempts >= MAX_LOGIN_ATTEMPTS) {
          delete db.mfaChallenges[challenge.id]
        }
        writeDb(db)
        throw new HttpError(401, 'INVALID_CODE', 'The verification code is incorrect.')
      }

      const user = findUserById(db, challenge.userId)
      if (!user || user.deletedAt || user.status === 'inactive') {
        throw new HttpError(401, 'UNAUTHORIZED', 'The account is no longer available.')
      }

      delete db.mfaChallenges[challenge.id]
      delete db.loginAttempts[user.email.toLowerCase()]
      return loginResult(db, user, request)
    }),
  ),

  http.post(`${API}/auth/register`, ({ request }) =>
    run(async () => {
      const body = await readJson<RegisterBody>(request)
      const name = requireString(body?.name, 'VALIDATION_ERROR', 'Name is required.')
      if (name.length < 2) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Name must be at least 2 characters.')
      }
      const email = validateEmail(body?.email)
      const password = validatePassword(body?.password)

      const db = readDb()
      if (findUserByEmail(db, email)) {
        throw new HttpError(409, 'EMAIL_TAKEN', 'An account with this email already exists.')
      }
      if (!findRole(db, 'viewer')) {
        throw new HttpError(500, 'ROLE_MISSING', 'The default role is unavailable.')
      }

      const user = createUserRecord(db, {
        name,
        email,
        password,
        roleId: 'viewer',
        department: 'Product',
      })
      user.emailVerified = false
      user.status = 'active'

      db.verificationTokens = pruneExpiredTokens(db.verificationTokens)
      const verificationToken = createToken()
      db.verificationTokens.push({
        token: verificationToken,
        userId: user.id,
        expiresAt: Date.now() + VERIFICATION_TOKEN_TTL,
      })

      logActivity(db, 'user.created', user.name, user.name)
      writeDb(db)
      return { email: user.email, verificationToken }
    }),
  ),

  http.post(`${API}/auth/verify-email`, ({ request }) =>
    run(async () => {
      const body = await readJson<TokenBody>(request)
      const token = requireString(
        body?.token,
        'VALIDATION_ERROR',
        'Verification token is required.',
      )

      const db = readDb()
      const record = db.verificationTokens.find((item) => item.token === token)
      if (!record || record.expiresAt <= Date.now()) {
        throw new HttpError(400, 'INVALID_TOKEN', 'This verification link is invalid or expired.')
      }

      const user = findUserById(db, record.userId)
      if (!user || user.deletedAt) {
        throw new HttpError(400, 'INVALID_TOKEN', 'This verification link is invalid or expired.')
      }

      user.emailVerified = true
      db.verificationTokens = db.verificationTokens.filter((item) => item.userId !== user.id)
      writeDb(db)
      return { email: user.email }
    }),
  ),

  http.post(`${API}/auth/forgot-password`, ({ request }) =>
    run(async () => {
      const body = await readJson<ForgotPasswordBody>(request)
      const email = validateEmail(body?.email)

      const db = readDb()
      const user = findUserByEmail(db, email)
      if (!user || user.deletedAt) return {}

      db.passwordResetTokens = pruneExpiredTokens(db.passwordResetTokens).filter(
        (item) => item.userId !== user.id,
      )
      const resetToken = createToken()
      db.passwordResetTokens.push({
        token: resetToken,
        userId: user.id,
        expiresAt: Date.now() + PASSWORD_RESET_TTL,
      })
      writeDb(db)
      // Exposing the token is demo-only; a real API emails it to the account owner.
      return { demoResetToken: resetToken }
    }),
  ),

  http.post(`${API}/auth/reset-password`, ({ request }) =>
    runNoContent(async () => {
      const body = await readJson<ResetPasswordBody>(request)
      const token = requireString(body?.token, 'VALIDATION_ERROR', 'Reset token is required.')
      const password = validatePassword(body?.password)

      const db = readDb()
      const record = db.passwordResetTokens.find((item) => item.token === token)
      if (!record || record.expiresAt <= Date.now()) {
        throw new HttpError(400, 'INVALID_TOKEN', 'This reset link is invalid or expired.')
      }

      const user = findUserById(db, record.userId)
      if (!user || user.deletedAt) {
        throw new HttpError(400, 'INVALID_TOKEN', 'This reset link is invalid or expired.')
      }

      user.password = password
      revokeSessionsForUser(db, user.id)
      delete db.loginAttempts[user.email.toLowerCase()]
      db.passwordResetTokens = db.passwordResetTokens.filter((item) => item.userId !== user.id)
      writeDb(db)
    }),
  ),

  http.get(`${API}/auth/invites/:token`, ({ params }) =>
    run(() => {
      const db = readDb()
      const invite = findInvite(db, String(params.token))
      return serializeInvite(db, invite)
    }),
  ),

  http.post(`${API}/auth/accept-invite`, ({ request }) =>
    run(async () => {
      const body = await readJson<AcceptInviteBody>(request)
      const token = requireString(body?.token, 'VALIDATION_ERROR', 'Invite token is required.')
      const name = requireString(body?.name, 'VALIDATION_ERROR', 'Name is required.')
      if (name.length < 2) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Name must be at least 2 characters.')
      }
      const password = validatePassword(body?.password)

      const db = readDb()
      const invite = findInvite(db, token)
      if (findUserByEmail(db, invite.email)) {
        throw new HttpError(409, 'EMAIL_TAKEN', 'An account with this email already exists.')
      }
      if (!findRole(db, invite.roleId)) {
        throw new HttpError(400, 'ROLE_MISSING', 'The invited role no longer exists.')
      }

      const user = createUserRecord(db, {
        name,
        email: invite.email,
        password,
        roleId: invite.roleId,
        department: 'Operations',
      })
      invite.acceptedAt = new Date().toISOString()
      logActivity(db, 'user.created', invite.invitedByName, user.name)
      return loginResult(db, user, request)
    }),
  ),

  http.post(`${API}/auth/refresh`, ({ request }) =>
    run(async () => {
      const body = await readJson<RefreshBody>(request)
      if (!body?.refreshToken) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Refresh token is required.')
      }

      const db = readDb()
      const session = db.sessions.find((item) => item.refreshToken === body.refreshToken)
      if (!session || session.expiresAt <= Date.now()) {
        throw new HttpError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired.')
      }

      const user = findUserById(db, session.userId)
      if (!user || user.deletedAt || user.status === 'inactive' || !user.emailVerified) {
        throw new HttpError(401, 'INVALID_REFRESH_TOKEN', 'The account is no longer available.')
      }

      rotateSession(session)
      const accessToken = issueAccessToken(user, session)
      writeDb(db)
      return { accessToken, refreshToken: session.refreshToken }
    }),
  ),

  http.post(`${API}/auth/logout`, ({ request }) =>
    runNoContent(async () => {
      const body = await readJson<RefreshBody>(request)
      if (!body?.refreshToken) return

      const db = readDb()
      const session = db.sessions.find((item) => item.refreshToken === body.refreshToken)
      if (session) {
        revokeSession(db, session.id)
        writeDb(db)
      }
    }),
  ),

  http.get(`${API}/auth/me`, ({ request }) =>
    run(() => {
      const db = readDb()
      const actor = authenticate(db, request)
      return serializeAuthUser(db, actor.user)
    }),
  ),

  http.get(`${API}/auth/sessions`, ({ request }) =>
    run(() => {
      const db = readDb()
      const actor = authenticate(db, request)
      const now = Date.now()
      return db.sessions
        .filter((session) => session.userId === actor.user.id && session.expiresAt > now)
        .sort((a, b) => {
          if (a.id === actor.session.id) return -1
          if (b.id === actor.session.id) return 1
          return b.lastActiveAt - a.lastActiveAt
        })
        .map((session) => serializeSession(session, actor.session.id))
    }),
  ),

  http.delete(`${API}/auth/sessions/:id`, ({ request, params }) =>
    runNoContent(async () => {
      const db = readDb()
      const actor = authenticate(db, request)
      const sessionId = String(params.id)
      const session = db.sessions.find(
        (item) => item.id === sessionId && item.userId === actor.user.id,
      )
      if (!session) throw new HttpError(404, 'SESSION_NOT_FOUND', 'Session not found.')
      if (session.id === actor.session.id) {
        throw new HttpError(400, 'CANNOT_REVOKE_CURRENT', 'You cannot revoke the current session.')
      }
      revokeSession(db, session.id)
      writeDb(db)
    }),
  ),

  http.delete(`${API}/auth/sessions`, ({ request }) =>
    runNoContent(async () => {
      const db = readDb()
      const actor = authenticate(db, request)
      revokeSessionsForUser(db, actor.user.id, actor.session.id)
      writeDb(db)
    }),
  ),

  http.post(`${API}/auth/change-password`, ({ request }) =>
    runNoContent(async () => {
      const body = await readJson<ChangePasswordBody>(request)
      const currentPassword = requireString(
        body?.currentPassword,
        'VALIDATION_ERROR',
        'Current password is required.',
      )
      const newPassword = validatePassword(body?.newPassword)

      const db = readDb()
      const actor = authenticate(db, request)
      if (actor.user.password !== currentPassword) {
        throw new HttpError(400, 'INVALID_PASSWORD', 'The current password is incorrect.')
      }
      if (currentPassword === newPassword) {
        throw new HttpError(400, 'PASSWORD_UNCHANGED', 'Choose a password you have not used here.')
      }

      actor.user.password = newPassword
      revokeSessionsForUser(db, actor.user.id, actor.session.id)
      delete db.loginAttempts[actor.user.email.toLowerCase()]
      writeDb(db)
    }),
  ),

  http.post(`${API}/auth/2fa/setup`, ({ request }) =>
    run(() => {
      const db = readDb()
      const actor = authenticate(db, request)
      if (actor.user.twoFactorEnabled) {
        throw new HttpError(409, 'ALREADY_ENABLED', 'Two-factor authentication is already enabled.')
      }
      actor.user.twoFactorSecret = DEMO_MFA_SECRET
      writeDb(db)
      // The secret and code are fixed demo values so the flow is testable without an app.
      return { secret: DEMO_MFA_SECRET, demoCode: DEMO_MFA_CODE }
    }),
  ),

  http.post(`${API}/auth/2fa/enable`, ({ request }) =>
    run(async () => {
      const body = await readJson<TwoFactorEnableBody>(request)
      const code = requireString(body?.code, 'VALIDATION_ERROR', 'Verification code is required.')

      const db = readDb()
      const actor = authenticate(db, request)
      if (actor.user.twoFactorEnabled) {
        throw new HttpError(409, 'ALREADY_ENABLED', 'Two-factor authentication is already enabled.')
      }
      if (!actor.user.twoFactorSecret) {
        throw new HttpError(400, 'SETUP_REQUIRED', 'Start the two-factor setup first.')
      }
      if (code !== DEMO_MFA_CODE) {
        throw new HttpError(400, 'INVALID_CODE', 'The verification code is incorrect.')
      }

      actor.user.twoFactorEnabled = true
      writeDb(db)
      return { twoFactorEnabled: true }
    }),
  ),

  http.post(`${API}/auth/2fa/disable`, ({ request }) =>
    run(async () => {
      const body = await readJson<TwoFactorDisableBody>(request)
      const password = requireString(body?.password, 'VALIDATION_ERROR', 'Password is required.')

      const db = readDb()
      const actor = authenticate(db, request)
      if (!actor.user.twoFactorEnabled) {
        throw new HttpError(400, 'NOT_ENABLED', 'Two-factor authentication is not enabled.')
      }
      if (actor.user.password !== password) {
        throw new HttpError(400, 'INVALID_PASSWORD', 'The password is incorrect.')
      }

      actor.user.twoFactorEnabled = false
      delete actor.user.twoFactorSecret
      revokeSessionsForUser(db, actor.user.id, actor.session.id)
      writeDb(db)
      return { twoFactorEnabled: false }
    }),
  ),
]
