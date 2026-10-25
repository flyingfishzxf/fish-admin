import type { ProjectPriority, ProjectStatus } from '@/types'

export type ProjectsView = 'board' | 'list'
export type ProjectSortKey = 'updatedAt' | 'name' | 'dueDate' | 'progress' | 'budget'
export type SortOrder = 'asc' | 'desc'

export interface ProjectsSearch {
  page: number
  pageSize: number
  q?: string
  status?: ProjectStatus
  priority?: ProjectPriority
  ownerId?: string
  departmentId?: string
  view: ProjectsView
  archived: boolean
  sort: ProjectSortKey
  order: SortOrder
}

const STATUSES: ProjectStatus[] = ['planning', 'active', 'review', 'done']
const PRIORITIES: ProjectPriority[] = ['low', 'medium', 'high']
const SORTS: ProjectSortKey[] = ['updatedAt', 'name', 'dueDate', 'progress', 'budget']

export const DEFAULT_PROJECTS_SEARCH: ProjectsSearch = {
  page: 1,
  pageSize: 6,
  view: 'board',
  archived: false,
  sort: 'updatedAt',
  order: 'desc',
}

export function validateProjectsSearch(search: Record<string, unknown>): ProjectsSearch {
  const page = Number(search.page)
  const pageSize = Number(search.pageSize)
  const view: ProjectsView = search.view === 'list' ? 'list' : 'board'
  const archived = search.archived === true || search.archived === '1' || search.archived === 'true'
  const sort = SORTS.includes(search.sort as ProjectSortKey)
    ? (search.sort as ProjectSortKey)
    : 'updatedAt'
  const order: SortOrder = search.order === 'asc' ? 'asc' : 'desc'
  const status = STATUSES.includes(search.status as ProjectStatus)
    ? (search.status as ProjectStatus)
    : undefined
  const priority = PRIORITIES.includes(search.priority as ProjectPriority)
    ? (search.priority as ProjectPriority)
    : undefined

  return {
    page: Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1,
    pageSize:
      Number.isFinite(pageSize) && pageSize >= 3 && pageSize <= 24 ? Math.floor(pageSize) : 6,
    q: typeof search.q === 'string' && search.q.trim() ? search.q.trim() : undefined,
    status,
    priority,
    ownerId: typeof search.ownerId === 'string' && search.ownerId ? search.ownerId : undefined,
    departmentId:
      typeof search.departmentId === 'string' && search.departmentId
        ? search.departmentId
        : undefined,
    view,
    archived,
    sort,
    order,
  }
}
