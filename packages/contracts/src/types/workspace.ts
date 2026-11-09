export type ProjectStatus = 'planning' | 'active' | 'review' | 'done'
export type ProjectPriority = 'low' | 'medium' | 'high'
export type ProjectTaskStatus = 'todo' | 'doing' | 'review' | 'done'
export type FileVisibility = 'team' | 'private'
export type IntegrationMode = 'immediate' | 'digest'
export type IntegrationDeliveryStatus = 'success' | 'failed'
export type NotificationKind = 'mention' | 'invite' | 'project' | 'system'
export type NotificationFilter = 'all' | 'unread' | 'mention'
export type ReportGranularity = 'day' | 'week' | 'month'

export interface ProjectBudgetItem {
  id: string
  label: string
  amount: number
}

export interface ProjectRecord {
  id: string
  name: string
  key: string
  description: string
  status: ProjectStatus
  priority: ProjectPriority
  ownerId: string
  memberIds: string[]
  departmentId?: string
  tags: string[]
  budget: number
  spent: number
  budgetItems: ProjectBudgetItem[]
  attachmentIds: string[]
  progress: number
  startDate: string
  dueDate: string
  featured: boolean
  archived: boolean
  reminderTime?: string
  rating?: number
  retro?: string
  createdAt: string
  updatedAt: string
}

export interface Project extends ProjectRecord {
  ownerName: string
  memberNames: string[]
  departmentName?: string
  taskCounts: Record<ProjectTaskStatus, number>
}

export interface ProjectTask {
  id: string
  projectId: string
  title: string
  status: ProjectTaskStatus
  assigneeId?: string
  assigneeName?: string
  dueDate: string
  estimateHours: number
  order: number
}

export interface ProjectMilestone {
  id: string
  projectId: string
  title: string
  date: string
  completed: boolean
}

export interface ProjectDetail {
  project: Project
  tasks: ProjectTask[]
  milestones: ProjectMilestone[]
  attachments: WorkspaceFile[]
}

export interface ProjectInput {
  name: string
  key: string
  description: string
  status: ProjectStatus
  priority: ProjectPriority
  ownerId: string
  memberIds: string[]
  departmentId?: string
  tags: string[]
  budget: number
  startDate: string
  dueDate: string
  featured?: boolean
}

export interface WorkspaceFile {
  id: string
  name: string
  folderId: string
  mime: string
  size: number
  dataUrl?: string
  uploadedById: string
  uploadedByName: string
  updatedAt: string
  visibility: FileVisibility
  favorite: boolean
}

export interface FileFolder {
  id: string
  name: string
  parentId: string | null
}

export interface IntegrationHeader {
  id: string
  key: string
  value: string
}

export interface Integration {
  id: string
  name: string
  provider: string
  endpoint: string
  event: string
  mode: IntegrationMode
  enabled: boolean
  headers: IntegrationHeader[]
  secretPreview: string
  createdAt: string
  lastDeliveryAt?: string
}

export interface IntegrationDelivery {
  id: string
  integrationId: string
  event: string
  status: IntegrationDeliveryStatus
  statusCode: number
  durationMs: number
  payload: Record<string, unknown>
  createdAt: string
}

export interface WorkspaceNotification {
  id: string
  userId: string
  kind: NotificationKind
  actorId?: string
  actorName?: string
  entityType?: 'project' | 'file' | 'integration' | 'user'
  entityId?: string
  entityLabel?: string
  read: boolean
  createdAt: string
}

export interface NotificationPreferences {
  quietStart: string
  quietEnd: string
  digest: 'off' | 'daily' | 'weekly'
  channels: {
    inApp: boolean
    email: boolean
    push: boolean
  }
}

export type WorkflowType = 'purchase' | 'leave' | 'seal' | 'change'
export type WorkflowStatus = 'pending' | 'approved' | 'rejected'
export type WorkflowDecision = 'approve' | 'reject' | 'transfer'
export type WorkflowStepAction = 'submitted' | 'approved' | 'rejected' | 'transferred'

export interface WorkflowFormField {
  label: string
  value: string
}

export interface WorkflowInstanceRecord {
  id: string
  code: string
  type: WorkflowType
  title: string
  summary: string
  initiatorId: string
  status: WorkflowStatus
  amount?: number
  form: WorkflowFormField[]
  /** Ordered approval chain. `currentStep` indexes the approver awaiting action. */
  approverIds: string[]
  currentStep: number
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface WorkflowInstance extends WorkflowInstanceRecord {
  initiatorName: string
  approverNames: string[]
  currentApproverId?: string
  currentApproverName?: string
  commentCount: number
}

export interface WorkflowStep {
  id: string
  instanceId: string
  action: WorkflowStepAction
  actorId: string
  actorName: string
  /** The approver the action targeted: the first approver when submitted, the new owner when transferred. */
  approverId?: string
  approverName?: string
  comment?: string
  createdAt: string
}

export interface WorkflowComment {
  id: string
  instanceId: string
  authorId: string
  authorName: string
  body: string
  createdAt: string
}

export interface WorkflowDetail {
  instance: WorkflowInstance
  steps: WorkflowStep[]
  comments: WorkflowComment[]
}

export interface ReportKpi {
  id: 'revenue' | 'orders' | 'conversion' | 'refunds'
  value: number
  change: number
}

export interface ReportPoint {
  date: string
  revenue: number
  orders: number
  days: number
}

export interface ReportChannel {
  name: string
  value: number
}

export interface ReportRow {
  id: string
  date: string
  channel: string
  revenue: number
  orders: number
  refunds: number
}

export interface ReportData {
  from: string
  to: string
  granularity: ReportGranularity
  kpis: ReportKpi[]
  series: ReportPoint[]
  channels: ReportChannel[]
  rows: ReportRow[]
  generatedAt: string
}
