import type {
  AuditAction,
  AuditEntityType,
  FileFolder,
  Integration,
  IntegrationDelivery,
  NotificationPreferences,
  ProjectMilestone,
  ProjectRecord,
  ProjectTask,
  UserStatus,
  WorkflowComment,
  WorkflowInstanceRecord,
  WorkflowStep,
  WorkspaceFile,
  WorkspaceNotification,
} from '@/types'

export const MOCK_DB_VERSION = 6
// The storage key stays stable so earlier demo databases can be migrated in place.
export const MOCK_DB_STORAGE_KEY = 'fish-admin:db:v1'

export type MockProjectRecord = ProjectRecord
export type MockTaskRecord = ProjectTask
export type MockMilestoneRecord = ProjectMilestone
export type MockFileFolderRecord = FileFolder
export type MockFileRecord = Omit<WorkspaceFile, 'uploadedByName'>
export type MockIntegrationRecord = Integration
export type MockDeliveryRecord = IntegrationDelivery
export type MockNotificationRecord = WorkspaceNotification
export type MockNotificationPreferences = NotificationPreferences
export type MockWorkflowRecord = WorkflowInstanceRecord
export type MockWorkflowStepRecord = WorkflowStep
export type MockWorkflowCommentRecord = WorkflowComment

export interface MockUserRecord {
  id: string
  name: string
  email: string
  password: string
  roleId: string
  status: UserStatus
  department: string
  departmentId?: string
  jobTitle?: string
  tags: string[]
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

export interface MockDepartmentRecord {
  id: string
  name: string
  parentId: string | null
  managerId?: string
  sortOrder: number
  createdAt: string
}

export interface MockDictionaryTypeRecord {
  id: string
  code: string
  name: string
  description: string
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

export interface MockDictionaryItemRecord {
  id: string
  dictionaryId: string
  label: string
  value: string
  description: string
  sortOrder: number
  enabled: boolean
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

export interface MockAuditEvent {
  id: string
  action: AuditAction
  actorId?: string
  actorName: string
  entityType: AuditEntityType
  entityId?: string
  entityLabel: string
  metadata: Record<string, string>
  createdAt: string
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
  departments: MockDepartmentRecord[]
  auditEvents: MockAuditEvent[]
  sessions: MockSession[]
  loginAttempts: Record<string, MockLoginAttempt>
  mfaChallenges: Record<string, MockMfaChallenge>
  verificationTokens: MockTokenRecord[]
  passwordResetTokens: MockTokenRecord[]
  invites: MockInvite[]
  notifications: MockNotificationRecord[]
  notificationPreferences: Record<string, MockNotificationPreferences>
  projects: MockProjectRecord[]
  tasks: MockTaskRecord[]
  milestones: MockMilestoneRecord[]
  fileFolders: MockFileFolderRecord[]
  files: MockFileRecord[]
  integrations: MockIntegrationRecord[]
  deliveries: MockDeliveryRecord[]
  workflows: MockWorkflowRecord[]
  workflowSteps: MockWorkflowStepRecord[]
  workflowComments: MockWorkflowCommentRecord[]
  dictionaryTypes: MockDictionaryTypeRecord[]
  dictionaryItems: MockDictionaryItemRecord[]
}
