import { faker } from '@faker-js/faker'

import type { AuditAction, AuditEntityType } from '@/types'

import type {
  MockAuditEvent,
  MockDeliveryRecord,
  MockDepartmentRecord,
  MockFileFolderRecord,
  MockFileRecord,
  MockIntegrationRecord,
  MockMilestoneRecord,
  MockNotificationPreferences,
  MockNotificationRecord,
  MockProjectRecord,
  MockTaskRecord,
  MockUserRecord,
} from './db/types'

const SEED = 2027
const DAY = 24 * 60 * 60 * 1000

export interface WorkspaceCollections {
  notifications: MockNotificationRecord[]
  notificationPreferences: Record<string, MockNotificationPreferences>
  projects: MockProjectRecord[]
  tasks: MockTaskRecord[]
  milestones: MockMilestoneRecord[]
  fileFolders: MockFileFolderRecord[]
  files: MockFileRecord[]
  integrations: MockIntegrationRecord[]
  deliveries: MockDeliveryRecord[]
  auditEvents: MockAuditEvent[]
}

function iso(offsetDays: number, hour = 9) {
  const date = new Date(Date.now() + offsetDays * DAY)
  date.setUTCHours(hour, 0, 0, 0)
  return date.toISOString()
}

function ago(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

function sampleSvg(label: string, hue: number) {
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200">',
    `<rect width="320" height="200" rx="12" fill="hsl(${hue} 72% 93%)"/>`,
    `<rect x="20" y="20" width="280" height="160" rx="14" fill="hsl(${hue} 62% 52%)"/>`,
    '<circle cx="64" cy="72" r="18" fill="rgba(255,255,255,0.35)"/>',
    '<rect x="94" y="62" width="150" height="8" rx="4" fill="rgba(255,255,255,0.55)"/>',
    '<rect x="94" y="80" width="110" height="8" rx="4" fill="rgba(255,255,255,0.35)"/>',
    `<text x="160" y="142" font-family="Inter,sans-serif" font-size="18" font-weight="600" fill="#fff" text-anchor="middle">${label}</text>`,
    '</svg>',
  ].join('')
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const PROJECT_DEFINITIONS = [
  {
    name: 'Atlas Design System',
    key: 'ATL',
    description: 'A shared component library that keeps every product surface consistent.',
    status: 'active',
    priority: 'high',
    departmentId: 'dept-engineering-frontend',
    tags: ['design-system', 'frontend'],
    budget: 48000,
    spent: 26400,
    progress: 58,
    start: -96,
    due: 24,
    featured: true,
  },
  {
    name: 'Billing Revamp',
    key: 'BIL',
    description: 'Usage-based invoices with clearer breakdowns and fewer support tickets.',
    status: 'review',
    priority: 'high',
    departmentId: 'dept-finance',
    tags: ['billing', 'finance'],
    budget: 62000,
    spent: 57100,
    progress: 84,
    start: -120,
    due: 9,
    featured: true,
  },
  {
    name: 'Mobile Onboarding',
    key: 'MOB',
    description: 'Cut first-run friction with guided setup and sample data.',
    status: 'active',
    priority: 'medium',
    departmentId: 'dept-design',
    tags: ['mobile', 'onboarding'],
    budget: 36000,
    spent: 15200,
    progress: 41,
    start: -64,
    due: 38,
    featured: true,
  },
  {
    name: 'Data Warehouse',
    key: 'DWH',
    description: 'Consolidate product analytics into a single governed warehouse.',
    status: 'planning',
    priority: 'medium',
    departmentId: 'dept-engineering-platform',
    tags: ['data', 'platform'],
    budget: 92000,
    spent: 4800,
    progress: 12,
    start: -18,
    due: 96,
    featured: false,
  },
  {
    name: 'Customer Portal',
    key: 'POR',
    description: 'Self-serve account, invoices and support history for every customer.',
    status: 'active',
    priority: 'high',
    departmentId: 'dept-product',
    tags: ['portal', 'customer'],
    budget: 74000,
    spent: 38900,
    progress: 52,
    start: -88,
    due: 31,
    featured: false,
  },
  {
    name: 'Release Automation',
    key: 'REL',
    description: 'One-click releases with changelog generation and rollback guards.',
    status: 'active',
    priority: 'medium',
    departmentId: 'dept-engineering-platform',
    tags: ['ci', 'automation'],
    budget: 28000,
    spent: 19800,
    progress: 67,
    start: -72,
    due: 17,
    featured: false,
  },
  {
    name: 'Search Relevance',
    key: 'SRCH',
    description: 'Tune ranking signals so the right records surface first.',
    status: 'review',
    priority: 'medium',
    departmentId: 'dept-engineering-frontend',
    tags: ['search', 'quality'],
    budget: 41000,
    spent: 35600,
    progress: 79,
    start: -104,
    due: 6,
    featured: false,
  },
  {
    name: 'Compliance Program',
    key: 'CMP',
    description: 'Document controls, evidence and retention for the annual audit.',
    status: 'review',
    priority: 'high',
    departmentId: 'dept-operations',
    tags: ['compliance', 'security'],
    budget: 33000,
    spent: 29500,
    progress: 88,
    start: -132,
    due: 12,
    featured: false,
  },
  {
    name: 'Partner API',
    key: 'API',
    description: 'Public REST endpoints, keys and sandbox for integration partners.',
    status: 'active',
    priority: 'low',
    departmentId: 'dept-engineering-platform',
    tags: ['api', 'partners'],
    budget: 52000,
    spent: 12600,
    progress: 34,
    start: -46,
    due: 54,
    featured: false,
  },
  {
    name: 'Insights Dashboard',
    key: 'INS',
    description: 'Executive view of revenue, adoption and support health.',
    status: 'planning',
    priority: 'low',
    departmentId: 'dept-product',
    tags: ['analytics', 'executive'],
    budget: 24000,
    spent: 1200,
    progress: 8,
    start: -10,
    due: 72,
    featured: false,
  },
  {
    name: 'Support Copilot',
    key: 'SUP',
    description: 'Draft replies and surface help articles while agents work a ticket.',
    status: 'done',
    priority: 'medium',
    departmentId: 'dept-operations-support',
    tags: ['support', 'ai'],
    budget: 45000,
    spent: 44100,
    progress: 100,
    start: -168,
    due: -21,
    featured: false,
  },
  {
    name: 'Brand Refresh',
    key: 'BRD',
    description: 'New visual language, voice and templates across every channel.',
    status: 'done',
    priority: 'low',
    departmentId: 'dept-marketing',
    tags: ['brand', 'marketing'],
    budget: 31000,
    spent: 30200,
    progress: 100,
    start: -186,
    due: -34,
    featured: false,
  },
] as const

const TASK_TITLES = [
  'Scope and success metrics',
  'Design exploration',
  'API contract',
  'Implementation',
  'QA and accessibility',
  'Launch checklist',
] as const

const PROJECT_STATUS_TASKS: Record<MockProjectRecord['status'], MockTaskRecord['status'][]> = {
  planning: ['doing', 'todo', 'todo', 'todo', 'todo', 'todo'],
  active: ['done', 'done', 'doing', 'doing', 'todo', 'review'],
  review: ['done', 'done', 'done', 'done', 'review', 'doing'],
  done: ['done', 'done', 'done', 'done', 'done', 'done'],
}

const MILESTONE_TITLES = ['Kickoff', 'Design review', 'Beta', 'Launch'] as const

const FOLDER_DEFINITIONS = [
  { id: 'folder-design', name: 'Design', parentId: null },
  { id: 'folder-design-brand', name: 'Brand', parentId: 'folder-design' },
  { id: 'folder-design-mockups', name: 'Mockups', parentId: 'folder-design' },
  { id: 'folder-engineering', name: 'Engineering', parentId: null },
  { id: 'folder-engineering-specs', name: 'Specs', parentId: 'folder-engineering' },
  { id: 'folder-engineering-releases', name: 'Releases', parentId: 'folder-engineering' },
  { id: 'folder-operations', name: 'Operations', parentId: null },
  { id: 'folder-operations-contracts', name: 'Contracts', parentId: 'folder-operations' },
] as const

const FILE_DEFINITIONS = [
  {
    name: 'brand-guidelines.svg',
    folderId: 'folder-design-brand',
    image: true,
    hue: 12,
    size: 184320,
  },
  { name: 'logo-primary.svg', folderId: 'folder-design-brand', image: true, hue: 210, size: 96256 },
  { name: 'logo-mono.svg', folderId: 'folder-design-brand', image: true, hue: 220, size: 71680 },
  {
    name: 'dashboard-light.svg',
    folderId: 'folder-design-mockups',
    image: true,
    hue: 155,
    size: 231424,
  },
  {
    name: 'dashboard-dark.svg',
    folderId: 'folder-design-mockups',
    image: true,
    hue: 260,
    size: 225280,
  },
  {
    name: 'mobile-onboarding.svg',
    folderId: 'folder-design-mockups',
    image: true,
    hue: 330,
    size: 172032,
  },
  {
    name: 'empty-state.svg',
    folderId: 'folder-design-mockups',
    image: true,
    hue: 190,
    size: 88064,
  },
  { name: 'atlas-hero.svg', folderId: 'folder-design', image: true, hue: 32, size: 204800 },
  {
    name: 'api-contract.svg',
    folderId: 'folder-engineering-specs',
    image: true,
    hue: 275,
    size: 118784,
  },
  {
    name: 'release-checklist.svg',
    folderId: 'folder-engineering-releases',
    image: true,
    hue: 95,
    size: 102400,
  },
  {
    name: 'platform-architecture.pdf',
    folderId: 'folder-engineering-specs',
    image: false,
    size: 1843200,
  },
  { name: 'q3-roadmap.pdf', folderId: 'folder-engineering', image: false, size: 942080 },
  { name: 'release-notes.md', folderId: 'folder-engineering-releases', image: false, size: 24576 },
  { name: 'incident-review.md', folderId: 'folder-operations', image: false, size: 36864 },
  {
    name: 'vendor-contract.pdf',
    folderId: 'folder-operations-contracts',
    image: false,
    size: 512000,
  },
  {
    name: 'renewal-terms.pdf',
    folderId: 'folder-operations-contracts',
    image: false,
    size: 430080,
  },
  { name: 'usage-export.csv', folderId: 'folder-operations', image: false, size: 153600 },
  { name: 'support-macros.md', folderId: 'folder-operations', image: false, size: 20480 },
] as const

const INTEGRATION_DEFINITIONS = [
  {
    name: 'Slack alerts',
    provider: 'Slack',
    endpoint: 'https://hooks.slack.com/services/T000/B000/XXXX',
    event: 'project.status_changed',
    mode: 'immediate',
    enabled: true,
    headers: [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'X-Installation', value: 'workspace' },
    ],
    secretPreview: 'xoxb_••••4f19',
  },
  {
    name: 'GitHub issues',
    provider: 'GitHub',
    endpoint: 'https://api.github.com/repos/flyingfishzxf/fish-admin/issues',
    event: 'task.created',
    mode: 'immediate',
    enabled: true,
    headers: [
      { key: 'Authorization', value: 'Bearer ••••' },
      { key: 'Accept', value: 'application/vnd.github+json' },
    ],
    secretPreview: 'ghp_••••c2a7',
  },
  {
    name: 'Stripe events',
    provider: 'Stripe',
    endpoint: 'https://api.stripe.com/v1/webhook_endpoints',
    event: 'invoice.paid',
    mode: 'immediate',
    enabled: true,
    headers: [{ key: 'Stripe-Version', value: '2026-06-30' }],
    secretPreview: 'whsec_••••7f2a',
  },
  {
    name: 'Linear sync',
    provider: 'Linear',
    endpoint: 'https://api.linear.app/graphql',
    event: 'project.created',
    mode: 'digest',
    enabled: true,
    headers: [{ key: 'X-Linear-Signature', value: '••••' }],
    secretPreview: 'lin_••••91b0',
  },
  {
    name: 'Datadog metrics',
    provider: 'Datadog',
    endpoint: 'https://api.datadoghq.com/api/v1/series',
    event: 'file.uploaded',
    mode: 'digest',
    enabled: false,
    headers: [{ key: 'DD-API-KEY', value: '••••' }],
    secretPreview: 'dd_••••e5c3',
  },
  {
    name: 'Partner webhook',
    provider: 'Custom',
    endpoint: 'https://partner.example.com/hooks/fish-admin',
    event: 'project.archived',
    mode: 'immediate',
    enabled: true,
    headers: [
      { key: 'X-Signature', value: 'sha256=••••' },
      { key: 'Content-Type', value: 'application/json' },
    ],
    secretPreview: 'whsec_••••33d8',
  },
] as const

const AUDIT_ACTIONS: AuditAction[] = [
  'project.created',
  'project.updated',
  'project.archived',
  'file.uploaded',
  'file.updated',
  'file.deleted',
  'integration.created',
  'integration.updated',
  'integration.deleted',
]

function entityForAction(
  action: AuditAction,
  projects: MockProjectRecord[],
  files: MockFileRecord[],
  integrations: MockIntegrationRecord[],
  index: number,
) {
  if (action.startsWith('project.')) {
    const project =
      action === 'project.archived'
        ? (projects.find((entry) => entry.archived) ?? projects[index % projects.length])
        : projects[index % projects.length]
    return {
      entityType: 'project' as AuditEntityType,
      entityId: project.id,
      entityLabel: project.name,
    }
  }
  if (action.startsWith('file.')) {
    const file = files[index % files.length]
    return { entityType: 'file' as AuditEntityType, entityId: file.id, entityLabel: file.name }
  }
  const integration = integrations[index % integrations.length]
  return {
    entityType: 'integration' as AuditEntityType,
    entityId: integration.id,
    entityLabel: integration.name,
  }
}

const BUDGET_LABELS = ['Engineering', 'Design', 'Tooling', 'Travel'] as const
const BUDGET_SHARES = [0.42, 0.28, 0.18, 0.12] as const

function buildBudgetItems(projectId: string, spent: number) {
  const amounts = BUDGET_SHARES.map((share) => Math.round(spent * share))
  const remainder = spent - amounts.reduce((total, amount) => total + amount, 0)
  amounts[amounts.length - 1] += remainder

  return BUDGET_LABELS.map((label, index) => ({
    id: `${projectId}-budget-${index + 1}`,
    label,
    amount: amounts[index],
  }))
}

export function createWorkspaceSeed(
  users: MockUserRecord[],
  departments: MockDepartmentRecord[],
): WorkspaceCollections {
  faker.seed(SEED)
  const ownerPool = users.length > 0 ? users : []
  const departmentIds = new Set(departments.map((department) => department.id))

  const projects: MockProjectRecord[] = PROJECT_DEFINITIONS.map((definition, index) => {
    const owner = ownerPool[index % Math.max(ownerPool.length, 1)]
    const projectId = `project-${definition.key.toLowerCase()}`
    const memberIds = [
      owner?.id,
      ownerPool[(index + 1) % Math.max(ownerPool.length, 1)]?.id,
      ownerPool[(index + 2) % Math.max(ownerPool.length, 1)]?.id,
      ownerPool[(index + 3) % Math.max(ownerPool.length, 1)]?.id,
    ].filter((id, position, list): id is string => Boolean(id) && list.indexOf(id) === position)

    return {
      id: projectId,
      name: definition.name,
      key: definition.key,
      description: definition.description,
      status: definition.status,
      priority: definition.priority,
      ownerId: owner?.id ?? 'user-admin',
      memberIds,
      departmentId: departmentIds.has(definition.departmentId)
        ? definition.departmentId
        : undefined,
      tags: [...definition.tags],
      budget: definition.budget,
      spent: definition.spent,
      budgetItems: buildBudgetItems(projectId, definition.spent),
      attachmentIds: [],
      progress: definition.progress,
      startDate: iso(definition.start),
      dueDate: iso(definition.due),
      featured: definition.featured,
      archived: index === PROJECT_DEFINITIONS.length - 1,
      reminderTime: index % 3 === 0 ? '17:30' : '09:00',
      rating: definition.status === 'done' ? 5 : undefined,
      retro:
        definition.status === 'done'
          ? 'Shipped on schedule. The demo data and release checklist were the biggest wins.'
          : undefined,
      createdAt: iso(definition.start - 4),
      updatedAt: iso(Math.round(definition.start / 2)),
    }
  })

  const tasks: MockTaskRecord[] = projects.flatMap((project, projectIndex) => {
    const statuses = PROJECT_STATUS_TASKS[project.status]
    return TASK_TITLES.map((title, index) => {
      const assigneeId = project.memberIds[index % Math.max(project.memberIds.length, 1)]
      return {
        id: `task-${project.key.toLowerCase()}-${index + 1}`,
        projectId: project.id,
        title,
        status: statuses[index],
        assigneeId,
        dueDate: iso(index * 7 - 14 + (projectIndex % 3) * 2),
        estimateHours: [8, 12, 10, 24, 12, 4][index],
        order: index,
      }
    })
  })

  const milestones: MockMilestoneRecord[] = projects.flatMap((project) => {
    const completedCount =
      project.status === 'done'
        ? 4
        : project.status === 'review'
          ? 3
          : project.status === 'active'
            ? 2
            : 0
    return MILESTONE_TITLES.map((title, index) => ({
      id: `milestone-${project.key.toLowerCase()}-${index + 1}`,
      projectId: project.id,
      title,
      date: iso(index * 14 - 28),
      completed: index < completedCount,
    }))
  })

  const fileFolders: MockFileFolderRecord[] = FOLDER_DEFINITIONS.map((folder) => ({ ...folder }))

  const files: MockFileRecord[] = FILE_DEFINITIONS.map((definition, index) => {
    const uploader = ownerPool[index % Math.max(ownerPool.length, 1)]
    return {
      id: `file-${index + 1}`,
      name: definition.name,
      folderId: definition.folderId,
      mime: definition.image
        ? 'image/svg+xml'
        : definition.name.endsWith('.pdf')
          ? 'application/pdf'
          : definition.name.endsWith('.csv')
            ? 'text/csv'
            : 'text/markdown',
      size: definition.size,
      dataUrl: definition.image
        ? sampleSvg(
            definition.name.replace(/[-.]/g, ' ').replace(/\s+/g, ' ').trim(),
            definition.hue,
          )
        : undefined,
      uploadedById: uploader?.id ?? 'user-admin',
      updatedAt: iso(-2 - index * 3),
      visibility: index % 5 === 0 ? 'private' : 'team',
      favorite: index % 4 === 0,
    }
  })

  for (const [index, project] of projects.entries()) {
    project.attachmentIds = [
      files[index % files.length].id,
      files[(index + 3) % files.length].id,
    ].filter((id, position, list) => list.indexOf(id) === position)
  }

  const integrations: MockIntegrationRecord[] = INTEGRATION_DEFINITIONS.map(
    (definition, index) => ({
      id: `integration-${index + 1}`,
      name: definition.name,
      provider: definition.provider,
      endpoint: definition.endpoint,
      event: definition.event,
      mode: definition.mode,
      enabled: definition.enabled,
      headers: definition.headers.map((header, headerIndex) => ({
        id: `header-${index + 1}-${headerIndex + 1}`,
        ...header,
      })),
      secretPreview: definition.secretPreview,
      createdAt: iso(-140 + index * 18),
      lastDeliveryAt: ago(3 + index * 7),
    }),
  )

  const deliveries: MockDeliveryRecord[] = integrations.flatMap((integration, integrationIndex) =>
    Array.from({ length: 4 }, (_, index) => {
      const failed = (integrationIndex + index) % 5 === 0
      return {
        id: `delivery-${integrationIndex + 1}-${index + 1}`,
        integrationId: integration.id,
        event: integration.event,
        status: failed ? 'failed' : 'success',
        statusCode: failed ? 500 : 200,
        durationMs: 120 + ((integrationIndex + index) % 5) * 73,
        payload: {
          id: `evt_${integrationIndex + 1}${index + 1}`,
          type: integration.event,
          createdAt: ago(index * 6 + integrationIndex + 2),
          data: { workspace: 'fish-admin', attempt: 4 - index },
        },
        createdAt: ago(index * 6 + integrationIndex + 2),
      }
    }),
  )

  const notificationKinds: MockNotificationRecord['kind'][] = [
    'mention',
    'project',
    'invite',
    'system',
    'mention',
    'project',
  ]

  const notifications: MockNotificationRecord[] = []
  const admin = ownerPool.find((user) => user.id === 'user-admin') ?? ownerPool[0]
  if (admin) {
    for (let index = 0; index < 24; index += 1) {
      const kind = notificationKinds[index % notificationKinds.length]
      const actor = ownerPool[(index + 1) % ownerPool.length]
      const project = projects[index % projects.length]
      const file = files[index % files.length]
      const integration = integrations[index % integrations.length]
      const entity =
        kind === 'project' || kind === 'mention'
          ? { entityType: 'project' as const, entityId: project.id, entityLabel: project.name }
          : kind === 'system'
            ? {
                entityType: 'integration' as const,
                entityId: integration.id,
                entityLabel: integration.name,
              }
            : { entityType: 'file' as const, entityId: file.id, entityLabel: file.name }

      notifications.push({
        id: `notification-${index + 1}`,
        userId: admin.id,
        kind,
        actorId: actor?.id,
        actorName: actor?.name,
        ...entity,
        read: index >= 6,
        createdAt: ago(index * 5 + 1),
      })
    }
  }

  for (const extraUser of ownerPool.filter((user) => user.id !== admin?.id).slice(0, 2)) {
    for (let index = 0; index < 5; index += 1) {
      notifications.push({
        id: `notification-${extraUser.id}-${index + 1}`,
        userId: extraUser.id,
        kind: notificationKinds[index % notificationKinds.length],
        actorId: admin?.id,
        actorName: admin?.name,
        entityType: 'project',
        entityId: projects[index].id,
        entityLabel: projects[index].name,
        read: index > 0,
        createdAt: ago(index * 9 + 3),
      })
    }
  }

  const notificationPreferences: Record<string, MockNotificationPreferences> = {}
  for (const user of ownerPool) {
    notificationPreferences[user.id] = {
      quietStart: '22:00',
      quietEnd: '08:00',
      digest: user.id === 'user-viewer' ? 'weekly' : 'daily',
      channels: {
        inApp: true,
        email: user.id !== 'user-viewer',
        push: user.id === 'user-admin',
      },
    }
  }

  const auditEvents: MockAuditEvent[] = Array.from({ length: 60 }, (_, index) => {
    const action = AUDIT_ACTIONS[index % AUDIT_ACTIONS.length]
    const actor = ownerPool[(index + 2) % Math.max(ownerPool.length, 1)]
    const entity = entityForAction(action, projects, files, integrations, index)
    const metadata: Record<string, string> = action.endsWith('.updated')
      ? { field: faker.helpers.arrayElement(['status', 'name', 'visibility']), source: 'console' }
      : { source: 'console' }

    return {
      id: `audit-workspace-${index + 1}`,
      action,
      actorId: actor?.id,
      actorName: actor?.name ?? 'System',
      ...entity,
      metadata,
      createdAt: new Date(Date.now() - (index + 1) * 5 * 60 * 60 * 1000).toISOString(),
    }
  })

  return {
    notifications,
    notificationPreferences,
    projects,
    tasks,
    milestones,
    fileFolders,
    files,
    integrations,
    deliveries,
    auditEvents,
  }
}
