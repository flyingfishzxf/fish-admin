import { beforeEach, describe, expect, it, vi } from 'vitest'

const { apiRequestMock } = vi.hoisted(() => ({ apiRequestMock: vi.fn() }))

vi.mock('@/lib/api-client', () => ({ apiRequest: apiRequestMock }))

import {
  archiveProject,
  createProject,
  createProjectTask,
  fetchProject,
  fetchProjects,
  removeProjectAttachment,
  toggleMilestone,
  updateProject,
  updateProjectTask,
  uploadProjectAttachment,
} from './api'

describe('project API client', () => {
  const signal = new AbortController().signal

  beforeEach(() => {
    apiRequestMock.mockReset()
    apiRequestMock.mockResolvedValue(undefined)
  })

  it('serializes the project list query', () => {
    fetchProjects(
      {
        page: 2,
        pageSize: 6,
        q: 'atlas launch',
        status: 'active',
        priority: 'high',
        ownerId: 'user-ada',
        departmentId: 'dept-engineering',
        archived: true,
        sort: 'dueDate',
        order: 'asc',
      },
      signal,
    )

    expect(apiRequestMock).toHaveBeenCalledWith(
      '/projects?page=2&pageSize=6&q=atlas+launch&status=active&priority=high&ownerId=user-ada&departmentId=dept-engineering&archived=1&sort=dueDate&order=asc',
      { signal },
    )
  })

  it('omits empty project filters', () => {
    fetchProjects({ page: 1, pageSize: 6 }, signal)

    expect(apiRequestMock).toHaveBeenCalledWith('/projects?page=1&pageSize=6', { signal })
  })

  it('encodes project and nested resource ids', () => {
    fetchProject('project/atl', signal)
    updateProject('project/atl', { rating: 4 })
    toggleMilestone('project/atl', 'milestone/1', true)
    updateProjectTask('project/atl', 'task/1', { status: 'done' })

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, '/projects/project%2Fatl', { signal })
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, '/projects/project%2Fatl', {
      method: 'PATCH',
      body: { rating: 4 },
    })
    expect(apiRequestMock).toHaveBeenNthCalledWith(
      3,
      '/projects/project%2Fatl/milestones/milestone%2F1',
      { method: 'PATCH', body: { completed: true } },
    )
    expect(apiRequestMock).toHaveBeenNthCalledWith(4, '/projects/project%2Fatl/tasks/task%2F1', {
      method: 'PATCH',
      body: { status: 'done' },
    })
  })

  it('sends project and task creation payloads', () => {
    const input = {
      name: 'Atlas',
      key: 'ATL',
      description: 'Launch',
      status: 'planning' as const,
      priority: 'high' as const,
      ownerId: 'user-ada',
      memberIds: ['user-ada'],
      tags: ['design'],
      budget: 12000,
      startDate: '2026-10-01',
      dueDate: '2026-11-30',
    }
    createProject(input)
    createProjectTask('project-atl', { title: 'Draft scope', status: 'todo' })

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, '/projects', {
      method: 'POST',
      body: input,
    })
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, '/projects/project-atl/tasks', {
      method: 'POST',
      body: { title: 'Draft scope', status: 'todo' },
    })
  })

  it('archives through the shared update endpoint', () => {
    archiveProject('project-atl')

    expect(apiRequestMock).toHaveBeenCalledWith('/projects/project-atl', {
      method: 'PATCH',
      body: { archived: true },
    })
  })

  it('uploads and detaches attachments', () => {
    const input = { name: 'brief.svg', mime: 'image/svg+xml', size: 128, dataUrl: 'data:,' }
    uploadProjectAttachment('project-atl', input)
    removeProjectAttachment('project-atl', 'file/1')

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, '/projects/project-atl/attachments', {
      method: 'POST',
      body: input,
      timeoutMs: 60_000,
    })
    expect(apiRequestMock).toHaveBeenNthCalledWith(
      2,
      '/projects/project-atl/attachments/file%2F1',
      { method: 'DELETE' },
    )
  })
})
