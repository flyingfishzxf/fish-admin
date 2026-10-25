import { apiRequest } from '@/lib/api-client'
import type {
  PaginatedResult,
  Project,
  ProjectDetail,
  ProjectInput,
  ProjectStatus,
  ProjectTask,
  ProjectTaskStatus,
  WorkspaceFile,
} from '@/types'

export type ProjectSortKey = 'updatedAt' | 'name' | 'dueDate' | 'progress' | 'budget'

export interface ProjectListParams {
  page: number
  pageSize: number
  q?: string
  status?: ProjectStatus
  priority?: string
  ownerId?: string
  departmentId?: string
  archived?: boolean
  sort?: ProjectSortKey
  order?: 'asc' | 'desc'
}

export function fetchProjects(params: ProjectListParams) {
  const search = new URLSearchParams()
  search.set('page', String(params.page))
  search.set('pageSize', String(params.pageSize))
  if (params.q) search.set('q', params.q)
  if (params.status) search.set('status', params.status)
  if (params.priority) search.set('priority', params.priority)
  if (params.ownerId) search.set('ownerId', params.ownerId)
  if (params.departmentId) search.set('departmentId', params.departmentId)
  if (params.archived) search.set('archived', '1')
  if (params.sort) search.set('sort', params.sort)
  if (params.order) search.set('order', params.order)

  return apiRequest<PaginatedResult<Project>>(`/projects?${search.toString()}`)
}

export function fetchProject(id: string) {
  return apiRequest<ProjectDetail>(`/projects/${encodeURIComponent(id)}`)
}

export function createProject(input: ProjectInput) {
  return apiRequest<Project>('/projects', { method: 'POST', body: input })
}

export interface ProjectUpdateInput {
  name?: string
  description?: string
  status?: ProjectStatus
  priority?: string
  memberIds?: string[]
  budget?: number
  budgetItems?: Array<{ id?: string; label: string; amount: number }>
  progress?: number
  tags?: string[]
  rating?: number
  retro?: string
  reminderTime?: string
  archived?: boolean
}

export function updateProject(id: string, input: ProjectUpdateInput) {
  return apiRequest<Project>(`/projects/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: input,
  })
}

export function archiveProject(id: string) {
  return updateProject(id, { archived: true })
}

export function createProjectTask(
  projectId: string,
  input: { title: string; status?: ProjectTaskStatus; assigneeId?: string; dueDate?: string },
) {
  return apiRequest<ProjectTask>(`/projects/${encodeURIComponent(projectId)}/tasks`, {
    method: 'POST',
    body: input,
  })
}

export function updateProjectTask(
  projectId: string,
  taskId: string,
  input: { status?: ProjectTaskStatus; title?: string; assigneeId?: string },
) {
  return apiRequest<ProjectTask>(
    `/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}`,
    { method: 'PATCH', body: input },
  )
}

export function toggleMilestone(projectId: string, milestoneId: string, completed: boolean) {
  return apiRequest<{ id: string; completed: boolean }>(
    `/projects/${encodeURIComponent(projectId)}/milestones/${encodeURIComponent(milestoneId)}`,
    { method: 'PATCH', body: { completed } },
  )
}

export function uploadProjectAttachment(
  projectId: string,
  input: { name: string; mime: string; size: number; dataUrl?: string },
) {
  return apiRequest<{ file: WorkspaceFile; project: Project }>(
    `/projects/${encodeURIComponent(projectId)}/attachments`,
    { method: 'POST', body: input },
  )
}

export function removeProjectAttachment(projectId: string, fileId: string) {
  return apiRequest<void>(
    `/projects/${encodeURIComponent(projectId)}/attachments/${encodeURIComponent(fileId)}`,
    { method: 'DELETE' },
  )
}
