import type { ActivityItem, UserStatus } from '@/types'

export const MOCK_DB_VERSION = 2
// The storage key stays stable so earlier demo databases can be migrated in place.
export const MOCK_DB_STORAGE_KEY = 'fish-admin:db:v1'

export interface MockUserRecord {
  id: string
  name: string
  email: string
  password: string
  roleId: string
  status: UserStatus
  department: string
  avatar?: string
  bio?: string
  emailVerified: boolean
  twoFactorEnabled: boolean
  twoFactorSecret?: string
  createdAt: string
  lastActiveAt: string
  deletedAt?: string
}

export interface MockRoleRecord {
  id: string
  name: string
  description: string
  permissions: string[]
  isSystem: boolean
}

export interface MockSession {
  id: string
  userId: string
  refreshToken: string
  createdAt: number
  lastActiveAt: number
  expiresAt: number
  userAgent: string
  ip: string
  revokedAt?: number
}

export interface MockLoginAttempt {
  count: number
  firstAt: number
  lockedUntil?: number
}

export interface MockMfaChallenge {
  id: string
  userId: string
  code: string
  expiresAt: number
  attempts: number
}

export interface MockTokenRecord {
  token: string
  userId: string
  expiresAt: number
}

export interface MockInvite {
  token: string
  email: string
  name?: string
  roleId: string
  invitedByName: string
  createdAt: string
  expiresAt: string
  acceptedAt?: string
}

export interface MockDb {
  version: typeof MOCK_DB_VERSION
  seededAt: string
  users: MockUserRecord[]
  roles: MockRoleRecord[]
  activity: ActivityItem[]
  sessions: MockSession[]
  loginAttempts: Record<string, MockLoginAttempt>
  mfaChallenges: Record<string, MockMfaChallenge>
  verificationTokens: MockTokenRecord[]
  passwordResetTokens: MockTokenRecord[]
  invites: MockInvite[]
}
