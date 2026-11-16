import type { Department, Project, ProjectMilestone, ProjectTask } from '@fish-admin/contracts'
import { describe, expect, it } from 'vitest'

import {
  budgetTotals,
  flattenDepartments,
  groupMilestones,
  groupTasks,
  portfolioOf,
  taskCompletion,
} from './utils'

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    name: 'Atlas',
    key: 'ATL',
    description: '',
    status: 'active',
    priority: 'high',
    ownerId: 'u1',
    memberIds: ['u1'],
    tags: [],
    budget: 1000,
    spent: 250,
    budgetItems: [],
    attachmentIds: [],
    progress: 50,
    startDate: '2026-01-01T00:00:00.000Z',
    dueDate: '2026-02-01T00:00:00.000Z',
    featured: false,
    archived: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ownerName: 'Ada',
    memberNames: ['Ada'],
    taskCounts: { todo: 1, doing: 0, review: 0, done: 1 },
    ...overrides,
  }
}

function task(id: string, status: ProjectTask['status']): ProjectTask {
  return {
    id,
    projectId: 'p1',
    title: id,
    status,
    dueDate: '2026-01-10T00:00:00.000Z',
    estimateHours: 2,
    order: 0,
  }
}

function milestone(id: string, date: string, completed: boolean): ProjectMilestone {
  return { id, projectId: 'p1', title: id, date, completed }
}

function department(
  id: string,
  name: string,
  parentId: string | null,
  sortOrder: number,
): Department {
  return {
    id,
    name,
    parentId,
    directMemberCount: 1,
    memberCount: 1,
    sortOrder,
    createdAt: '2026-01-01T00:00:00.000Z',
  }
}

describe('portfolioOf', () => {
  it('counts only active projects and averages progress', () => {
    const summary = portfolioOf([
      project(),
      project({ id: 'p2', status: 'done', budget: 500, spent: 500, progress: 100 }),
      project({ id: 'p3', status: 'planning', budget: 500, spent: 0, progress: 0 }),
    ])

    expect(summary).toEqual({
      active: 1,
      budget: 2000,
      spent: 750,
      completion: 50,
      utilization: 38,
    })
  })

  it('returns zeroes for an empty portfolio instead of NaN', () => {
    expect(portfolioOf([])).toEqual({
      active: 0,
      budget: 0,
      spent: 0,
      completion: 0,
      utilization: 0,
    })
  })
})

describe('flattenDepartments', () => {
  it('walks parents before children by sort order', () => {
    const departments = [
      department('d2', 'Product', null, 2),
      department('d1', 'Engineering', null, 1),
      department('d3', 'Frontend', 'd1', 1),
      department('d4', 'Platform', 'd1', 2),
    ]

    expect(flattenDepartments(departments)).toEqual([
      { value: 'd1', label: 'Engineering' },
      { value: 'd3', label: 'Engineering / Frontend' },
      { value: 'd4', label: 'Engineering / Platform' },
      { value: 'd2', label: 'Product' },
    ])
  })
})

describe('groupMilestones', () => {
  it('groups by day, earliest first, and marks a day complete only when all are', () => {
    const groups = groupMilestones([
      milestone('m2', '2026-02-01T00:00:00.000Z', true),
      milestone('m1', '2026-02-01T00:00:00.000Z', false),
      milestone('m3', '2026-01-15T00:00:00.000Z', true),
    ])

    expect(groups.map((group) => group.date)).toEqual(['2026-01-15', '2026-02-01'])
    expect(groups[0]?.completed).toBe(true)
    expect(groups[1]?.completed).toBe(false)
    expect(groups[1]?.milestones.map((entry) => entry.id)).toEqual(['m2', 'm1'])
  })

  it('returns nothing for no milestones', () => {
    expect(groupMilestones([])).toEqual([])
  })
})

describe('groupTasks and taskCompletion', () => {
  const tasks = [task('t1', 'todo'), task('t2', 'done'), task('t3', 'done')]

  it('keeps the four columns in order even when empty', () => {
    expect(groupTasks(tasks).map((group) => [group.status, group.tasks.length])).toEqual([
      ['todo', 1],
      ['doing', 0],
      ['review', 0],
      ['done', 2],
    ])
  })

  it('computes completion from the task count, not the project field', () => {
    expect(taskCompletion(tasks)).toEqual({ done: 2, total: 3, percent: 67 })
    expect(taskCompletion([])).toEqual({ done: 0, total: 0, percent: 0 })
  })
})

describe('budgetTotals', () => {
  it('sums the draft rows and reports what is left', () => {
    expect(
      budgetTotals(
        [
          { id: 'b1', label: 'Design', amount: 400 },
          { id: 'b2', label: 'Build', amount: 700 },
        ],
        1000,
      ),
    ).toEqual({ spent: 1100, remaining: -100, utilization: 110 })
  })

  it('does not divide by a zero budget', () => {
    expect(budgetTotals([{ id: 'b1', label: 'Design', amount: 10 }], 0)).toEqual({
      spent: 10,
      remaining: -10,
      utilization: 0,
    })
  })
})
