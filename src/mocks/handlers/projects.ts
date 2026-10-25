import { http } from 'msw'

import { env } from '@/config/env'
import { PERMISSION_CODES } from '@/config/permissions'
import type { Project, ProjectDetail, ProjectStatus, ProjectTaskStatus } from '@/types'

import { authorize } from '../auth'
import { findDepartment, findUserById, logAuditEvent, readDb, writeDb } from '../db/store'
import type { MockDb, MockFileRecord, MockProjectRecord, MockTaskRecord } from '../db/types'
import { HttpError, readJson, run, runNoContent } from '../http'

const API = env.apiBaseUrl
const STATUSES: ProjectStatus[] = ['planning', 'active', 'review', 'done']
const PRIORITIES = ['low', 'medium', 'high'] as const
const TASK_STATUSES: ProjectTaskStatus[] = ['todo', 'doing', 'review', 'done']
const MAX_DATA_URL = 256_000
const DEFAULT_FOLDER_ID = 'folder-engineering'

interface ProjectBody {
  name?: string
  key?: string
  description?: string
  status?: ProjectStatus
  priority?: (typeof PRIORITIES)[number]
  ownerId?: string
  memberIds?: string[]
  departmentId?: string
  tags?: string[]
  budget?: number
  progress?: number
  startDate?: string
  dueDate?: string
  featured?: boolean
  archived?: boolean
  rating?: number
  retro?: string
  reminderTime?: string
  budgetItems?: Array<{ id?: string; label: string; amount: number }>
}

interface TaskBody {
  title?: string
  status?: ProjectTaskStatus
  assigneeId?: string
  dueDate?: string
  estimateHours?: number
}

interface AttachmentBody {
  name?: string
  mime?: string
  size?: number
  dataUrl?: string
}

function serializeTask(db: MockDb, task: MockTaskRecord) {
  return {
    ...task,
    assigneeName: task.assigneeId ? findUserById(db, task.assigneeId)?.name : undefined,
  }
}

function taskCounts(db: MockDb, projectId: string) {
  const counts: Record<ProjectTaskStatus, number> = { todo: 0, doing: 0, review: 0, done: 0 }
  for (const task of db.tasks) {
    if (task.projectId === projectId) counts[task.status] += 1
  }
  return counts
}

function serializeProject(db: MockDb, project: MockProjectRecord): Project {
  return {
    ...project,
    ownerName: findUserById(db, project.ownerId)?.name ?? '—',
    memberNames: project.memberIds
      .map((id) => findUserById(db, id)?.name)
      .filter((name): name is string => Boolean(name)),
    departmentName: project.departmentId
      ? findDepartment(db, project.departmentId)?.name
      : undefined,
    taskCounts: taskCounts(db, project.id),
  }
}

function findProject(db: MockDb, id: string) {
  const project = db.projects.find((entry) => entry.id === id)
  if (!project) throw new HttpError(404, 'PROJECT_NOT_FOUND', 'Project not found.')
  return project
}

function readString(value: unknown, field: string, min: number, max: number) {
  if (typeof value !== 'string') {
    throw new HttpError(400, 'VALIDATION_ERROR', `${field} is required.`)
  }
  const trimmed = value.trim()
  if (trimmed.length < min || trimmed.length > max) {
    throw new HttpError(400, 'VALIDATION_ERROR', `${field} must be ${min}-${max} characters.`)
  }
  return trimmed
}

function ensureMembers(db: MockDb, ids: unknown) {
  if (!Array.isArray(ids)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Members must be a list.')
  }
  const members = [...new Set(ids.filter((id): id is string => typeof id === 'string'))].filter(
    (id) => Boolean(findUserById(db, id)),
  )
  if (members.length === 0) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Choose at least one member.')
  }
  return members.slice(0, 20)
}

function ensureTags(tags: unknown) {
  if (tags === undefined) return undefined
  if (!Array.isArray(tags)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Tags must be a list.')
  }
  return [
    ...new Set(
      tags
        .filter((tag): tag is string => typeof tag === 'string')
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ].slice(0, 6)
}

function ensureBudgetItems(items: unknown) {
  if (items === undefined) return undefined
  if (!Array.isArray(items)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Budget lines must be a list.')
  }
  return items.map((item) => {
    const record = item as { id?: string; label?: string; amount?: number }
    const label = typeof record.label === 'string' ? record.label.trim() : ''
    const amount = Number(record.amount)
    if (!label || !Number.isFinite(amount) || amount < 0) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Each budget line needs a label and amount.')
    }
    return { id: record.id || `budget-${crypto.randomUUID()}`, label, amount: Math.round(amount) }
  })
}

function ensureDate(value: unknown, field: string) {
  if (typeof value !== 'string' || Number.isNaN(new Date(value).getTime())) {
    throw new HttpError(400, 'VALIDATION_ERROR', `${field} must be a valid date.`)
  }
  return new Date(value).toISOString()
}

export const projectHandlers = [
  http.get(`${API}/projects`, ({ request }) =>
    run(() => {
      const db = readDb()
      authorize(db, request, PERMISSION_CODES.projectRead)
      const url = new URL(request.url)
      const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))
      const pageSize = Math.min(Math.max(Number(url.searchParams.get('pageSize') ?? 6), 1), 50)
      const q = (url.searchParams.get('q') ?? '').trim().toLowerCase()
      const status = url.searchParams.get('status') as ProjectStatus | null
      const priority = url.searchParams.get('priority')
      const ownerId = url.searchParams.get('ownerId')
      const departmentId = url.searchParams.get('departmentId')
      const archived = url.searchParams.get('archived') === '1'
      const sort = url.searchParams.get('sort') ?? 'updatedAt'
      const order = url.searchParams.get('order') === 'asc' ? 1 : -1

      const filtered = db.projects.filter((project) => {
        if (project.archived !== archived) return false
        if (status && project.status !== status) return false
        if (priority && project.priority !== priority) return false
        if (ownerId && project.ownerId !== ownerId) return false
        if (departmentId && project.departmentId !== departmentId) return false
        if (!q) return true
        return [project.name, project.key, project.description, ...project.tags]
          .join(' ')
          .toLowerCase()
          .includes(q)
      })

      const sorted = [...filtered].sort((a, b) => {
        if (sort === 'name') return a.name.localeCompare(b.name) * order
        if (sort === 'dueDate') return a.dueDate.localeCompare(b.dueDate) * order
        if (sort === 'progress') return (a.progress - b.progress) * order
        if (sort === 'budget') return (a.budget - b.budget) * order
        return a.updatedAt.localeCompare(b.updatedAt) * order
      })

      const total = sorted.length
      const pageCount = Math.max(1, Math.ceil(total / pageSize))
      const currentPage = Math.min(page, pageCount)
      const start = (currentPage - 1) * pageSize

      return {
        items: sorted
          .slice(start, start + pageSize)
          .map((project) => serializeProject(db, project)),
        total,
        page: currentPage,
        pageSize,
        pageCount,
      }
    }),
  ),

  http.get(`${API}/projects/:id`, ({ request, params }) =>
    run(() => {
      const db = readDb()
      authorize(db, request, PERMISSION_CODES.projectRead)
      const project = findProject(db, String(params.id))

      const detail: ProjectDetail = {
        project: serializeProject(db, project),
        tasks: db.tasks
          .filter((task) => task.projectId === project.id)
          .sort((a, b) => a.order - b.order)
          .map((task) => serializeTask(db, task)),
        milestones: db.milestones
          .filter((milestone) => milestone.projectId === project.id)
          .sort((a, b) => a.date.localeCompare(b.date)),
        attachments: project.attachmentIds.flatMap((fileId) => {
          const file = db.files.find((entry) => entry.id === fileId)
          if (!file) return []
          return [
            {
              ...file,
              uploadedByName: findUserById(db, file.uploadedById)?.name ?? '—',
            },
          ]
        }),
      }
      return detail
    }),
  ),

  http.post(`${API}/projects`, ({ request }) =>
    run(async () => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.projectManage)
      const body = (await readJson<ProjectBody>(request)) ?? {}

      const name = readString(body.name, 'Name', 2, 60)
      const key = readString(body.key, 'Key', 2, 6).toUpperCase()
      if (!/^[A-Z]{2,6}$/.test(key)) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Key must be 2-6 letters.')
      }
      if (db.projects.some((project) => project.key === key)) {
        throw new HttpError(409, 'KEY_TAKEN', 'A project with this key already exists.')
      }
      if (!body.ownerId || !findUserById(db, body.ownerId)) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Choose a project owner.')
      }
      if (!body.status || !STATUSES.includes(body.status)) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Choose a valid status.')
      }
      if (!body.priority || !PRIORITIES.includes(body.priority)) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Choose a valid priority.')
      }
      const memberIds = ensureMembers(db, body.memberIds ?? [body.ownerId])
      if (!memberIds.includes(body.ownerId)) memberIds.unshift(body.ownerId)
      const budget = Number(body.budget ?? 0)
      if (!Number.isFinite(budget) || budget < 0) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Budget must be a positive amount.')
      }
      const startDate = ensureDate(body.startDate, 'Start date')
      const dueDate = ensureDate(body.dueDate, 'Due date')
      if (dueDate < startDate) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Due date must follow the start date.')
      }
      if (body.departmentId && !findDepartment(db, body.departmentId)) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Choose a valid department.')
      }

      const now = new Date().toISOString()
      const record: MockProjectRecord = {
        id: `project-${crypto.randomUUID()}`,
        name,
        key,
        description: typeof body.description === 'string' ? body.description.trim() : '',
        status: body.status,
        priority: body.priority,
        ownerId: body.ownerId,
        memberIds,
        departmentId: body.departmentId,
        tags: ensureTags(body.tags) ?? [],
        budget: Math.round(budget),
        spent: 0,
        budgetItems: [],
        attachmentIds: [],
        progress: 0,
        startDate,
        dueDate,
        featured: body.featured === true,
        archived: false,
        createdAt: now,
        updatedAt: now,
      }

      db.projects.unshift(record)
      logAuditEvent(db, {
        action: 'project.created',
        actorId: actor.user.id,
        actorName: actor.user.name,
        entityType: 'project',
        entityId: record.id,
        entityLabel: record.name,
        metadata: { key: record.key, ownerId: record.ownerId },
      })
      writeDb(db)
      return serializeProject(db, record)
    }),
  ),

  http.patch(`${API}/projects/:id`, ({ request, params }) =>
    run(async () => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.projectManage)
      const project = findProject(db, String(params.id))
      const body = (await readJson<ProjectBody>(request)) ?? {}
      const changed: string[] = []

      if (body.name !== undefined) {
        project.name = readString(body.name, 'Name', 2, 60)
        changed.push('name')
      }
      if (body.description !== undefined) {
        if (typeof body.description !== 'string' || body.description.length > 240) {
          throw new HttpError(
            400,
            'VALIDATION_ERROR',
            'Description must be 240 characters or fewer.',
          )
        }
        project.description = body.description.trim()
        changed.push('description')
      }
      if (body.status !== undefined) {
        if (!STATUSES.includes(body.status)) {
          throw new HttpError(400, 'VALIDATION_ERROR', 'Choose a valid status.')
        }
        if (body.status !== project.status) {
          project.status = body.status
          if (body.status === 'done') project.progress = 100
          changed.push('status')
        }
      }
      if (body.priority !== undefined) {
        if (!PRIORITIES.includes(body.priority)) {
          throw new HttpError(400, 'VALIDATION_ERROR', 'Choose a valid priority.')
        }
        project.priority = body.priority
        changed.push('priority')
      }
      if (body.memberIds !== undefined) {
        project.memberIds = ensureMembers(db, body.memberIds)
        changed.push('members')
      }
      if (body.budget !== undefined) {
        const budget = Number(body.budget)
        if (!Number.isFinite(budget) || budget < 0) {
          throw new HttpError(400, 'VALIDATION_ERROR', 'Budget must be a positive amount.')
        }
        project.budget = Math.round(budget)
        changed.push('budget')
      }
      if (body.budgetItems !== undefined) {
        const items = ensureBudgetItems(body.budgetItems) ?? []
        project.budgetItems = items
        project.spent = items.reduce((total, item) => total + item.amount, 0)
        changed.push('budgetItems')
      }
      if (body.progress !== undefined) {
        const progress = Number(body.progress)
        if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
          throw new HttpError(400, 'VALIDATION_ERROR', 'Progress must be between 0 and 100.')
        }
        project.progress = Math.round(progress)
        changed.push('progress')
      }
      if (body.tags !== undefined) {
        project.tags = ensureTags(body.tags) ?? []
        changed.push('tags')
      }
      if (body.rating !== undefined) {
        const rating = Number(body.rating)
        if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
          throw new HttpError(400, 'VALIDATION_ERROR', 'Rating must be between 1 and 5.')
        }
        project.rating = Math.round(rating)
        changed.push('rating')
      }
      if (body.retro !== undefined) {
        if (typeof body.retro !== 'string' || body.retro.length > 600) {
          throw new HttpError(
            400,
            'VALIDATION_ERROR',
            'Retro notes must be 600 characters or fewer.',
          )
        }
        project.retro = body.retro.trim()
        changed.push('retro')
      }
      if (body.reminderTime !== undefined) {
        if (body.reminderTime !== '' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(body.reminderTime)) {
          throw new HttpError(400, 'VALIDATION_ERROR', 'Reminder time must be HH:mm.')
        }
        project.reminderTime = body.reminderTime || undefined
        changed.push('reminderTime')
      }
      if (body.archived !== undefined) {
        project.archived = body.archived === true
        changed.push('archived')
      }

      if (changed.length === 0) {
        return serializeProject(db, project)
      }

      project.updatedAt = new Date().toISOString()
      const archivedChange = changed.includes('archived')
      logAuditEvent(db, {
        action: archivedChange ? 'project.archived' : 'project.updated',
        actorId: actor.user.id,
        actorName: actor.user.name,
        entityType: 'project',
        entityId: project.id,
        entityLabel: project.name,
        metadata: { fields: changed.join(', ') },
      })
      writeDb(db)
      return serializeProject(db, project)
    }),
  ),

  http.post(`${API}/projects/:id/tasks`, ({ request, params }) =>
    run(async () => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.projectManage)
      const project = findProject(db, String(params.id))
      const body = (await readJson<TaskBody>(request)) ?? {}
      const title = readString(body.title, 'Task title', 2, 80)
      const status = body.status && TASK_STATUSES.includes(body.status) ? body.status : 'todo'
      if (body.assigneeId && !project.memberIds.includes(body.assigneeId)) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'Assignee must be a project member.')
      }

      const task: MockTaskRecord = {
        id: `task-${crypto.randomUUID()}`,
        projectId: project.id,
        title,
        status,
        assigneeId: body.assigneeId,
        dueDate: ensureDate(body.dueDate ?? project.dueDate, 'Due date'),
        estimateHours: Math.max(1, Math.min(80, Number(body.estimateHours ?? 4))),
        order: db.tasks.filter((entry) => entry.projectId === project.id).length,
      }

      db.tasks.push(task)
      project.updatedAt = new Date().toISOString()
      logAuditEvent(db, {
        action: 'project.updated',
        actorId: actor.user.id,
        actorName: actor.user.name,
        entityType: 'project',
        entityId: project.id,
        entityLabel: project.name,
        metadata: { addedTask: task.title },
      })
      writeDb(db)
      return serializeTask(db, task)
    }),
  ),

  http.patch(`${API}/projects/:id/tasks/:taskId`, ({ request, params }) =>
    run(async () => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.projectManage)
      const project = findProject(db, String(params.id))
      const task = db.tasks.find(
        (entry) => entry.id === String(params.taskId) && entry.projectId === project.id,
      )
      if (!task) throw new HttpError(404, 'TASK_NOT_FOUND', 'Task not found.')
      const body = (await readJson<TaskBody>(request)) ?? {}

      if (body.status !== undefined) {
        if (!TASK_STATUSES.includes(body.status)) {
          throw new HttpError(400, 'VALIDATION_ERROR', 'Choose a valid task status.')
        }
        task.status = body.status
      }
      if (body.title !== undefined) task.title = readString(body.title, 'Task title', 2, 80)
      if (body.assigneeId !== undefined) {
        if (body.assigneeId && !project.memberIds.includes(body.assigneeId)) {
          throw new HttpError(400, 'VALIDATION_ERROR', 'Assignee must be a project member.')
        }
        task.assigneeId = body.assigneeId || undefined
      }

      project.updatedAt = new Date().toISOString()
      logAuditEvent(db, {
        action: 'project.updated',
        actorId: actor.user.id,
        actorName: actor.user.name,
        entityType: 'project',
        entityId: project.id,
        entityLabel: project.name,
        metadata: { task: task.title, status: task.status },
      })
      writeDb(db)
      return serializeTask(db, task)
    }),
  ),

  http.patch(`${API}/projects/:id/milestones/:milestoneId`, ({ request, params }) =>
    run(async () => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.projectManage)
      const project = findProject(db, String(params.id))
      const milestone = db.milestones.find(
        (entry) => entry.id === String(params.milestoneId) && entry.projectId === project.id,
      )
      if (!milestone) throw new HttpError(404, 'MILESTONE_NOT_FOUND', 'Milestone not found.')
      const body = (await readJson<{ completed?: boolean }>(request)) ?? {}
      milestone.completed = body.completed === true

      logAuditEvent(db, {
        action: 'project.updated',
        actorId: actor.user.id,
        actorName: actor.user.name,
        entityType: 'project',
        entityId: project.id,
        entityLabel: project.name,
        metadata: { milestone: milestone.title, completed: String(milestone.completed) },
      })
      writeDb(db)
      return milestone
    }),
  ),

  http.post(`${API}/projects/:id/attachments`, ({ request, params }) =>
    run(async () => {
      const db = readDb()
      const actor = authorize(db, request, PERMISSION_CODES.projectManage)
      const project = findProject(db, String(params.id))
      const body = (await readJson<AttachmentBody>(request)) ?? {}
      const name = readString(body.name, 'File name', 1, 120)
      const size = Number(body.size ?? 0)
      if (!Number.isFinite(size) || size < 0) {
        throw new HttpError(400, 'VALIDATION_ERROR', 'File size is invalid.')
      }
      const dataUrl =
        typeof body.dataUrl === 'string' && body.dataUrl.length <= MAX_DATA_URL
          ? body.dataUrl
          : undefined

      const file: MockFileRecord = {
        id: `file-${crypto.randomUUID()}`,
        name,
        folderId: DEFAULT_FOLDER_ID,
        mime: typeof body.mime === 'string' && body.mime ? body.mime : 'application/octet-stream',
        size: Math.round(size),
        dataUrl,
        uploadedById: actor.user.id,
        updatedAt: new Date().toISOString(),
        visibility: 'team',
        favorite: false,
      }

      db.files.unshift(file)
      project.attachmentIds = [file.id, ...project.attachmentIds].slice(0, 12)
      project.updatedAt = new Date().toISOString()
      logAuditEvent(db, {
        action: 'file.uploaded',
        actorId: actor.user.id,
        actorName: actor.user.name,
        entityType: 'file',
        entityId: file.id,
        entityLabel: file.name,
        metadata: { projectId: project.id },
      })
      writeDb(db)
      return { file, project: serializeProject(db, project) }
    }),
  ),

  http.delete(`${API}/projects/:id/attachments/:fileId`, ({ request, params }) =>
    runNoContent(() => {
      const db = readDb()
      authorize(db, request, PERMISSION_CODES.projectManage)
      const project = findProject(db, String(params.id))
      project.attachmentIds = project.attachmentIds.filter((id) => id !== String(params.fileId))
      writeDb(db)
    }),
  ),
]
