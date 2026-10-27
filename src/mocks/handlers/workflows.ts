import { http } from 'msw'

import { env } from '@/config/env'
import { PERMISSION_CODES } from '@/config/permissions'
import { hasPermission } from '@/lib/permissions'
import type {
  PaginatedResult,
  WorkflowComment,
  WorkflowDecision,
  WorkflowDetail,
  WorkflowInstance,
  WorkflowStatus,
  WorkflowStep,
  WorkflowType,
} from '@/types'

import { authorize } from '../auth'
import { findRole, findUserById, logAuditEvent, readDb, writeDb } from '../db/store'
import type { MockDb, MockWorkflowRecord } from '../db/types'
import { HttpError, readJson, run } from '../http'

const API = env.apiBaseUrl
const TYPES: WorkflowType[] = ['purchase', 'leave', 'seal', 'change']
const STATUSES: WorkflowStatus[] = ['pending', 'approved', 'rejected']
const VIEWS = ['mine', 'pending', 'all'] as const
const DECISIONS: WorkflowDecision[] = ['approve', 'reject', 'transfer']

interface WorkflowActionBody {
  decision?: WorkflowDecision
  comment?: string
  transferToId?: string
}

interface WorkflowCommentBody {
  body?: string
}

function currentApprover(record: MockWorkflowRecord) {
  return record.currentStep < record.approverIds.length
    ? record.approverIds[record.currentStep]
    : undefined
}

function serializeWorkflow(db: MockDb, record: MockWorkflowRecord): WorkflowInstance {
  const approverId = currentApprover(record)

  return {
    ...record,
    initiatorName: findUserById(db, record.initiatorId)?.name ?? '—',
    approverNames: record.approverIds.map((id) => findUserById(db, id)?.name ?? '—'),
    currentApproverId: approverId,
    currentApproverName: approverId ? (findUserById(db, approverId)?.name ?? '—') : undefined,
    commentCount: db.workflowComments.filter((comment) => comment.instanceId === record.id).length,
  }
}

function serializeStep(db: MockDb, step: WorkflowStep): WorkflowStep {
  return {
    ...step,
    actorName: findUserById(db, step.actorId)?.name ?? step.actorName,
    approverName: step.approverId
      ? (findUserById(db, step.approverId)?.name ?? step.approverName)
      : step.approverName,
  }
}

function serializeComment(db: MockDb, comment: WorkflowComment): WorkflowComment {
  return {
    ...comment,
    authorName: findUserById(db, comment.authorId)?.name ?? comment.authorName,
  }
}

function findWorkflow(db: MockDb, id: string) {
  const record = db.workflows.find((item) => item.id === id)
  if (!record) throw new HttpError(404, 'WORKFLOW_NOT_FOUND', 'Approval not found.')
  return record
}

function serializeDetail(db: MockDb, record: MockWorkflowRecord): WorkflowDetail {
  return {
    instance: serializeWorkflow(db, record),
    steps: db.workflowSteps
      .filter((step) => step.instanceId === record.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((step) => serializeStep(db, step)),
    comments: db.workflowComments
      .filter((comment) => comment.instanceId === record.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((comment) => serializeComment(db, comment)),
  }
}

function parseDayBoundary(value: string, endOfDay: boolean) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(
    year,
    month - 1,
    day,
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0,
  )
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }
  return date.getTime()
}

function readOptionalString(value: unknown) {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function canApprove(db: MockDb, userId: string) {
  const user = findUserById(db, userId)
  if (!user || user.deletedAt || user.status !== 'active') return false
  const role = findRole(db, user.roleId)
  return Boolean(role && hasPermission(role.permissions, PERMISSION_CODES.workflowApprove))
}

/**
 * The state machine lives here, not in the client: a real backend must redo this
 * with database transactions. See docs/{en,zh-CN}/workflows.md.
 */
export const workflowHandlers = [
  http.get(`${API}/workflows/approvers`, ({ request }) =>
    run(() => {
      const db = readDb()
      authorize(db, request, PERMISSION_CODES.workflowRead)

      return db.users
        .filter((user) => !user.deletedAt && user.status === 'active' && canApprove(db, user.id))
        .map((user) => ({
          id: user.id,
          name: user.name,
          jobTitle: user.jobTitle,
          department: user.department,
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    }),
  ),

  http.get(`${API}/workflows`, ({ request }) =>
    run((): PaginatedResult<WorkflowInstance> => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.workflowRead)

      const url = new URL(request.url)
      const view = VIEWS.includes(url.searchParams.get('view') as (typeof VIEWS)[number])
        ? (url.searchParams.get('view') as (typeof VIEWS)[number])
        : 'all'
      const statusParam = url.searchParams.get('status')
      const typeParam = url.searchParams.get('type')
      const initiatorId = readOptionalString(url.searchParams.get('initiatorId'))
      const search = url.searchParams.get('q')?.trim().toLowerCase() ?? ''
      const fromParam = url.searchParams.get('from')
      const toParam = url.searchParams.get('to')

      if (statusParam && !STATUSES.includes(statusParam as WorkflowStatus)) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Unknown approval status.')
      }
      if (typeParam && !TYPES.includes(typeParam as WorkflowType)) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Unknown approval type.')
      }

      const from = fromParam ? parseDayBoundary(fromParam, false) : null
      const to = toParam ? parseDayBoundary(toParam, true) : null
      if ((fromParam && from === null) || (toParam && to === null)) {
        throw new HttpError(400, 'INVALID_DATE_RANGE', 'Dates must use the yyyy-MM-dd format.')
      }
      if (from !== null && to !== null && from > to) {
        throw new HttpError(
          400,
          'INVALID_DATE_RANGE',
          'The start date must not be after the end date.',
        )
      }

      const filtered = db.workflows.filter((record) => {
        if (view === 'mine' && record.initiatorId !== actor.user.id) return false
        if (view === 'pending') {
          if (record.status !== 'pending') return false
          if (currentApprover(record) !== actor.user.id) return false
        }
        if (statusParam && record.status !== statusParam) return false
        if (typeParam && record.type !== typeParam) return false
        if (initiatorId && record.initiatorId !== initiatorId) return false
        if (from !== null && new Date(record.createdAt).getTime() < from) return false
        if (to !== null && new Date(record.createdAt).getTime() > to) return false
        if (!search) return true

        const haystack = [
          record.code,
          record.title,
          record.summary,
          findUserById(db, record.initiatorId)?.name ?? '',
          ...record.approverIds.map((id) => findUserById(db, id)?.name ?? ''),
        ]
          .join(' ')
          .toLowerCase()
        return haystack.includes(search)
      })

      const sorted = [...filtered].sort((a, b) => {
        const byUpdated = b.updatedAt.localeCompare(a.updatedAt)
        return byUpdated !== 0 ? byUpdated : a.code.localeCompare(b.code)
      })
      const pageSize = Math.min(Math.max(Number(url.searchParams.get('pageSize') ?? 10), 10), 100)
      const total = sorted.length
      const pageCount = Math.max(1, Math.ceil(total / pageSize))
      const page = Math.min(Math.max(Number(url.searchParams.get('page') ?? 1), 1), pageCount)
      const start = (page - 1) * pageSize

      return {
        items: sorted.slice(start, start + pageSize).map((record) => serializeWorkflow(db, record)),
        total,
        page,
        pageSize,
        pageCount,
      }
    }),
  ),

  http.get(`${API}/workflows/:id`, ({ request, params }) =>
    run((): WorkflowDetail => {
      const db = readDb()
      authorize(db, request, PERMISSION_CODES.workflowRead)
      return serializeDetail(db, findWorkflow(db, String(params.id)))
    }),
  ),

  http.post(`${API}/workflows/:id/decisions`, ({ request, params }) =>
    run(async (): Promise<WorkflowDetail> => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.workflowApprove)
      const record = findWorkflow(db, String(params.id))
      const body = await readJson<WorkflowActionBody>(request)
      const decision = body?.decision

      if (!decision || !DECISIONS.includes(decision)) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Choose approve, reject or transfer.')
      }
      if (record.status !== 'pending') {
        throw new HttpError(409, 'WORKFLOW_CLOSED', 'This approval is already closed.')
      }
      if (currentApprover(record) !== actor.user.id) {
        throw new HttpError(403, 'NOT_YOUR_TURN', 'This approval is waiting for someone else.')
      }

      const comment = readOptionalString(body?.comment)
      const now = new Date().toISOString()
      const stepId = `workflow-step-${crypto.randomUUID()}`

      if (decision === 'approve' || decision === 'reject') {
        db.workflowSteps.push({
          id: stepId,
          instanceId: record.id,
          action: decision === 'approve' ? 'approved' : 'rejected',
          actorId: actor.user.id,
          actorName: actor.user.name,
          approverId: actor.user.id,
          comment,
          createdAt: now,
        })

        if (decision === 'reject') {
          record.status = 'rejected'
          record.completedAt = now
        } else {
          record.currentStep += 1
          if (record.currentStep >= record.approverIds.length) {
            record.status = 'approved'
            record.completedAt = now
          }
        }

        record.updatedAt = now
        logAuditEvent(db, {
          action: decision === 'approve' ? 'workflow.approved' : 'workflow.rejected',
          actorId: actor.user.id,
          actorName: actor.user.name,
          entityType: 'workflow',
          entityId: record.id,
          entityLabel: `${record.code} · ${record.title}`,
          metadata: {
            decision,
            step: String(record.currentStep),
            status: record.status,
          },
        })
      } else {
        const target = readOptionalString(body?.transferToId)
        if (!target) {
          throw new HttpError(400, 'VALIDATION_ERROR', 'Choose who should take over.')
        }
        if (target === actor.user.id) {
          throw new HttpError(400, 'VALIDATION_ERROR', 'You already own this approval.')
        }
        if (!canApprove(db, target)) {
          throw new HttpError(400, 'VALIDATION_ERROR', 'That person cannot act on approvals.')
        }

        const targetUser = findUserById(db, target)
        record.approverIds[record.currentStep] = target
        record.updatedAt = now
        db.workflowSteps.push({
          id: stepId,
          instanceId: record.id,
          action: 'transferred',
          actorId: actor.user.id,
          actorName: actor.user.name,
          approverId: target,
          comment,
          createdAt: now,
        })
        logAuditEvent(db, {
          action: 'workflow.transferred',
          actorId: actor.user.id,
          actorName: actor.user.name,
          entityType: 'workflow',
          entityId: record.id,
          entityLabel: `${record.code} · ${record.title}`,
          metadata: {
            decision,
            to: targetUser?.name ?? target,
            status: record.status,
          },
        })
      }

      writeDb(db)
      return serializeDetail(db, record)
    }),
  ),

  http.post(`${API}/workflows/:id/comments`, ({ request, params }) =>
    run(async (): Promise<WorkflowComment[]> => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.workflowRead)
      const record = findWorkflow(db, String(params.id))
      const body = await readJson<WorkflowCommentBody>(request)
      const text = readOptionalString(body?.body)

      if (!text || text.length > 1000) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Comments must be 1-1000 characters.')
      }

      const now = new Date().toISOString()
      db.workflowComments.push({
        id: `workflow-comment-${crypto.randomUUID()}`,
        instanceId: record.id,
        authorId: actor.user.id,
        authorName: actor.user.name,
        body: text,
        createdAt: now,
      })
      record.updatedAt = now
      writeDb(db)

      return db.workflowComments
        .filter((comment) => comment.instanceId === record.id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map((comment) => serializeComment(db, comment))
    }),
  ),
]
