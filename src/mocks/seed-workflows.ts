import type {
  WorkflowComment,
  WorkflowFormField,
  WorkflowInstanceRecord,
  WorkflowStatus,
  WorkflowStep,
  WorkflowType,
} from '@/types'

import type { MockUserRecord } from './db/types'

const HOUR = 60 * 60 * 1000

interface SeedDecision {
  action: 'approved' | 'rejected' | 'transferred'
  actorId: string
  hoursAgo: number
  comment?: string
  transferToId?: string
}

interface SeedWorkflow {
  id: string
  code: string
  type: WorkflowType
  title: string
  summary: string
  initiatorId: string
  approverIds: string[]
  amount?: number
  form: WorkflowFormField[]
  createdHoursAgo: number
  decisions: SeedDecision[]
}

interface SeedComment {
  instanceId: string
  authorId: string
  hoursAgo: number
  body: string
}

const ADMIN = 'user-admin'
const MANAGER = 'user-manager'
const VIEWER = 'user-viewer'

const WORKFLOWS: SeedWorkflow[] = [
  {
    id: 'workflow-pur-1',
    code: 'WF-2026-0142',
    type: 'purchase',
    title: 'MacBook Pro for the design team',
    summary: 'Two 14-inch laptops for the incoming product designers.',
    initiatorId: MANAGER,
    approverIds: [ADMIN],
    amount: 4200,
    createdHoursAgo: 6,
    form: [
      { label: 'Vendor', value: 'Apple Business' },
      { label: 'Quantity', value: '2' },
      { label: 'Cost centre', value: 'ENG-DESIGN' },
      { label: 'Needed by', value: '2026-11-15' },
    ],
    decisions: [],
  },
  {
    id: 'workflow-pur-2',
    code: 'WF-2026-0141',
    type: 'purchase',
    title: 'Figma organization renewal',
    summary: 'Annual renewal for 40 full seats, effective next month.',
    initiatorId: MANAGER,
    approverIds: [ADMIN, MANAGER],
    amount: 9600,
    createdHoursAgo: 3,
    form: [
      { label: 'Vendor', value: 'Figma' },
      { label: 'Seats', value: '40' },
      { label: 'Cost centre', value: 'DESIGN-TOOLS' },
      { label: 'Term', value: '12 months' },
    ],
    decisions: [],
  },
  {
    id: 'workflow-leave-1',
    code: 'WF-2026-0140',
    type: 'leave',
    title: 'Annual leave — 3 days in November',
    summary: 'Family trip; the support rota has been covered by the pod lead.',
    initiatorId: VIEWER,
    approverIds: [MANAGER, ADMIN],
    createdHoursAgo: 9,
    form: [
      { label: 'Leave type', value: 'Annual' },
      { label: 'From', value: '2026-11-04' },
      { label: 'To', value: '2026-11-06' },
      { label: 'Cover', value: 'Support pod lead' },
    ],
    decisions: [],
  },
  {
    id: 'workflow-seal-1',
    code: 'WF-2026-0139',
    type: 'seal',
    title: 'Contract seal — Northwind renewal',
    summary: 'Countersigned renewal for the Northwind support agreement.',
    initiatorId: ADMIN,
    approverIds: [MANAGER],
    createdHoursAgo: 20,
    form: [
      { label: 'Counterparty', value: 'Northwind Traders' },
      { label: 'Document', value: 'Renewal 2026-2027' },
      { label: 'Copies', value: '2' },
      { label: 'Legal review', value: 'Completed' },
    ],
    decisions: [],
  },
  {
    id: 'workflow-change-1',
    code: 'WF-2026-0138',
    type: 'change',
    title: 'Change freeze exception for billing hotfix',
    summary: 'One-time deploy window outside the freeze for the invoice rounding fix.',
    initiatorId: MANAGER,
    approverIds: [ADMIN],
    createdHoursAgo: 30,
    form: [
      { label: 'Service', value: 'billing-api' },
      { label: 'Window', value: '2026-10-24 22:00 UTC' },
      { label: 'Duration', value: '30 minutes' },
      { label: 'Rollback', value: 'Previous release tag' },
    ],
    decisions: [{ action: 'approved', actorId: ADMIN, hoursAgo: 26, comment: 'Window approved.' }],
  },
  {
    id: 'workflow-pur-3',
    code: 'WF-2026-0137',
    type: 'purchase',
    title: 'Ergonomic chairs for the support pod',
    summary: 'Six adjustable chairs requested after the ergonomics review.',
    initiatorId: VIEWER,
    approverIds: [MANAGER],
    amount: 2400,
    createdHoursAgo: 40,
    form: [
      { label: 'Vendor', value: 'Herman Miller' },
      { label: 'Quantity', value: '6' },
      { label: 'Cost centre', value: 'OPS-FACILITIES' },
      { label: 'Needed by', value: '2026-12-01' },
    ],
    decisions: [
      {
        action: 'rejected',
        actorId: MANAGER,
        hoursAgo: 36,
        comment: 'Please re-quote with the refurbished option first.',
      },
    ],
  },
  {
    id: 'workflow-leave-2',
    code: 'WF-2026-0136',
    type: 'leave',
    title: 'Parental leave — 10 days',
    summary: 'Leave starting after the release cut; work has been reassigned.',
    initiatorId: VIEWER,
    approverIds: [ADMIN, MANAGER],
    createdHoursAgo: 60,
    form: [
      { label: 'Leave type', value: 'Parental' },
      { label: 'From', value: '2026-11-20' },
      { label: 'To', value: '2026-12-03' },
      { label: 'Handover', value: 'Release captain' },
    ],
    decisions: [
      { action: 'approved', actorId: ADMIN, hoursAgo: 52 },
      { action: 'approved', actorId: MANAGER, hoursAgo: 50, comment: 'Coverage confirmed.' },
    ],
  },
  {
    id: 'workflow-change-2',
    code: 'WF-2026-0135',
    type: 'change',
    title: 'Enable SSO for the staging workspace',
    summary: 'Move the staging demo onto the corporate identity provider.',
    initiatorId: ADMIN,
    approverIds: [MANAGER],
    createdHoursAgo: 80,
    form: [
      { label: 'Environment', value: 'staging' },
      { label: 'Provider', value: 'Okta' },
      { label: 'Scope', value: 'Staff accounts' },
      { label: 'Fallback', value: 'Password login kept for demos' },
    ],
    decisions: [{ action: 'approved', actorId: MANAGER, hoursAgo: 70 }],
  },
]

const COMMENTS: SeedComment[] = [
  {
    instanceId: 'workflow-pur-1',
    authorId: MANAGER,
    hoursAgo: 5,
    body: 'Please prioritise the 14-inch model if stock allows.',
  },
  {
    instanceId: 'workflow-pur-1',
    authorId: ADMIN,
    hoursAgo: 4,
    body: 'Confirmed with procurement; the quote covers the upgrade.',
  },
  {
    instanceId: 'workflow-change-1',
    authorId: MANAGER,
    hoursAgo: 28,
    body: 'Hotfix window is 30 minutes; the rollback plan is attached.',
  },
  {
    instanceId: 'workflow-leave-2',
    authorId: ADMIN,
    hoursAgo: 54,
    body: 'Handover looks complete — enjoy the break.',
  },
]

function ago(hours: number) {
  return new Date(Date.now() - hours * HOUR).toISOString()
}

function nameOf(users: MockUserRecord[], id: string) {
  return users.find((user) => user.id === id)?.name ?? 'Unknown user'
}

/** Replays the seed decisions so the chain, status and timeline cannot disagree. */
export function createWorkflowSeed(users: MockUserRecord[]) {
  const workflows: WorkflowInstanceRecord[] = []
  const steps: WorkflowStep[] = []
  const comments: WorkflowComment[] = []

  for (const definition of WORKFLOWS) {
    const approverIds = [...definition.approverIds]
    let currentStep = 0
    let status: WorkflowStatus = 'pending'
    let completedAt: string | undefined
    let lastActionAt = ago(definition.createdHoursAgo)

    steps.push({
      id: `${definition.id}-submitted`,
      instanceId: definition.id,
      action: 'submitted',
      actorId: definition.initiatorId,
      actorName: nameOf(users, definition.initiatorId),
      approverId: approverIds[0],
      createdAt: ago(definition.createdHoursAgo),
    })

    for (const [index, decision] of definition.decisions.entries()) {
      const createdAt = ago(decision.hoursAgo)
      lastActionAt = createdAt

      if (decision.action === 'transferred') {
        const target =
          decision.transferToId ?? approverIds[currentStep + 1] ?? approverIds[currentStep]
        steps.push({
          id: `${definition.id}-transfer-${index}`,
          instanceId: definition.id,
          action: 'transferred',
          actorId: decision.actorId,
          actorName: nameOf(users, decision.actorId),
          approverId: target,
          comment: decision.comment,
          createdAt,
        })
        approverIds[currentStep] = target
        continue
      }

      steps.push({
        id: `${definition.id}-${decision.action}-${index}`,
        instanceId: definition.id,
        action: decision.action,
        actorId: decision.actorId,
        actorName: nameOf(users, decision.actorId),
        approverId: approverIds[currentStep],
        comment: decision.comment,
        createdAt,
      })

      if (decision.action === 'rejected') {
        status = 'rejected'
        completedAt = createdAt
        continue
      }

      currentStep += 1
      if (currentStep >= approverIds.length) {
        status = 'approved'
        completedAt = createdAt
      }
    }

    workflows.push({
      id: definition.id,
      code: definition.code,
      type: definition.type,
      title: definition.title,
      summary: definition.summary,
      initiatorId: definition.initiatorId,
      status,
      amount: definition.amount,
      form: definition.form,
      approverIds,
      currentStep,
      createdAt: ago(definition.createdHoursAgo),
      updatedAt: lastActionAt,
      completedAt,
    })
  }

  for (const [index, comment] of COMMENTS.entries()) {
    comments.push({
      id: `workflow-comment-${index + 1}`,
      instanceId: comment.instanceId,
      authorId: comment.authorId,
      authorName: nameOf(users, comment.authorId),
      body: comment.body,
      createdAt: ago(comment.hoursAgo),
    })
  }

  return { workflows, workflowSteps: steps, workflowComments: comments }
}
