import type { ProjectDetail } from '@fish-admin/contracts'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Component } from 'vue'

import { i18nReady, setLanguage } from '../../lib/i18n'
import {
  createProjectTask,
  removeProjectAttachment,
  toggleMilestone,
  updateProject,
  updateProjectTask,
} from './api'
import ProjectBudgetTab from './ProjectBudgetTab.vue'
import ProjectOverviewTab from './ProjectOverviewTab.vue'
import ProjectReviewTab from './ProjectReviewTab.vue'
import ProjectTasksTab from './ProjectTasksTab.vue'

vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>()
  return {
    ...actual,
    updateProject: vi.fn(),
    createProjectTask: vi.fn(),
    updateProjectTask: vi.fn(),
    toggleMilestone: vi.fn(),
    removeProjectAttachment: vi.fn(),
    uploadProjectAttachment: vi.fn(),
    fetchProjectActivity: vi.fn(),
  }
})

const detail: ProjectDetail = {
  project: {
    id: 'p1',
    name: 'Atlas',
    key: 'ATL',
    description: 'A design system.',
    status: 'active',
    priority: 'high',
    ownerId: 'u1',
    memberIds: ['u1', 'u2'],
    tags: ['design-system'],
    budget: 1000,
    spent: 400,
    budgetItems: [
      { id: 'b1', label: 'Design', amount: 400 },
      { id: 'b2', label: 'Build', amount: 200 },
    ],
    attachmentIds: ['f1'],
    progress: 50,
    startDate: '2026-01-01T00:00:00.000Z',
    dueDate: '2026-06-01T00:00:00.000Z',
    featured: true,
    archived: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-02-01T00:00:00.000Z',
    ownerName: 'Ada Lovelace',
    memberNames: ['Ada Lovelace', 'Grace Hopper'],
    departmentName: 'Engineering',
    taskCounts: { todo: 1, doing: 1, review: 0, done: 1 },
  },
  tasks: [
    {
      id: 't1',
      projectId: 'p1',
      title: 'Draft the scope',
      status: 'todo',
      dueDate: '2026-02-10T00:00:00.000Z',
      estimateHours: 4,
      order: 0,
    },
    {
      id: 't2',
      projectId: 'p1',
      title: 'Ship tokens',
      status: 'done',
      assigneeId: 'u2',
      dueDate: '2026-02-12T00:00:00.000Z',
      estimateHours: 2,
      order: 1,
    },
  ],
  milestones: [
    {
      id: 'm1',
      projectId: 'p1',
      title: 'Kickoff',
      date: '2026-01-05T00:00:00.000Z',
      completed: true,
    },
    {
      id: 'm2',
      projectId: 'p1',
      title: 'Beta',
      date: '2026-03-05T00:00:00.000Z',
      completed: false,
    },
  ],
  attachments: [
    {
      id: 'f1',
      name: 'brief.md',
      folderId: 'folder-design',
      mime: 'text/markdown',
      size: 2048,
      uploadedById: 'u1',
      uploadedByName: 'Ada Lovelace',
      updatedAt: '2026-01-09T00:00:00.000Z',
      visibility: 'team',
      favorite: false,
    },
  ],
}

let wrapper: VueWrapper | null = null

function mountTab(component: Component, canManage = true) {
  wrapper = mount(component, {
    props: { detail, canManage },
    attachTo: document.body,
    global: {
      plugins: [
        [
          VueQueryPlugin,
          {
            queryClient: new QueryClient({
              defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
            }),
          },
        ],
      ],
    },
  })
  return wrapper
}

describe('ProjectTasksTab', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    document.body.innerHTML = ''
    vi.clearAllMocks()
    vi.mocked(createProjectTask).mockResolvedValue({ id: 't9' } as never)
    vi.mocked(updateProjectTask).mockResolvedValue({ id: 't1' } as never)
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.body.innerHTML = ''
  })

  it('groups tasks in the four columns and counts completion', async () => {
    const page = mountTab(ProjectTasksTab)
    await flushPromises()

    expect(page.findAll('[data-task-group]')).toHaveLength(4)
    expect(page.get('[data-task-group="todo"]').text()).toContain('Draft the scope')
    expect(page.get('[data-task-group="done"]').text()).toContain('Ship tokens')
    expect(page.get('[data-task-progress]').attributes('aria-valuenow')).toBe('50')
  })

  it('adds a task from the dialog', async () => {
    const page = mountTab(ProjectTasksTab)
    await flushPromises()

    await page.get('[data-add-task]').trigger('click')
    await flushPromises()
    const input = document.body.querySelector<HTMLInputElement>('[data-field="task-title"]')!
    input.value = 'Write the runbook'
    input.dispatchEvent(new Event('input'))
    await flushPromises()
    // jsdom does not submit a form from a programmatic button click.
    document.body
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushPromises()

    expect(createProjectTask).toHaveBeenCalledWith(
      'p1',
      expect.objectContaining({ title: 'Write the runbook', status: 'todo' }),
    )
  })

  it('offers no add button to a read-only role', async () => {
    const page = mountTab(ProjectTasksTab, false)
    await flushPromises()
    expect(page.find('[data-add-task]').exists()).toBe(false)
  })
})

describe('ProjectBudgetTab', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    document.body.innerHTML = ''
    vi.clearAllMocks()
    vi.mocked(updateProject).mockResolvedValue({ id: 'p1' } as never)
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.body.innerHTML = ''
  })

  it('computes the totals from the draft rows', async () => {
    const page = mountTab(ProjectBudgetTab)
    await flushPromises()

    // 400 + 200 of a 1000 budget leaves 400.
    expect(page.get('[data-budget-remaining]').text()).toContain('400')
    expect(page.findAll('[data-budget-row]')).toHaveLength(2)
  })

  it('saves the edited rows', async () => {
    const page = mountTab(ProjectBudgetTab)
    await flushPromises()

    const amount = document.body.querySelector<HTMLInputElement>('[data-budget-amount="b1"]')!
    amount.value = '650'
    amount.dispatchEvent(new Event('input'))
    await flushPromises()
    await page.get('[data-budget-save]').trigger('click')
    await flushPromises()

    expect(updateProject).toHaveBeenCalledWith('p1', {
      budgetItems: [
        { id: 'b1', label: 'Design', amount: 650 },
        { id: 'b2', label: 'Build', amount: 200 },
      ],
    })
  })

  it('hides the write controls from a read-only role', async () => {
    const page = mountTab(ProjectBudgetTab, false)
    await flushPromises()
    expect(page.find('[data-budget-save]').exists()).toBe(false)
    expect(page.find('[data-budget-add]').exists()).toBe(false)
  })
})

describe('ProjectReviewTab', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    document.body.innerHTML = ''
    vi.clearAllMocks()
    vi.mocked(updateProject).mockResolvedValue({ id: 'p1' } as never)
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.body.innerHTML = ''
  })

  it('refuses to save without a rating', async () => {
    const page = mountTab(ProjectReviewTab)
    await flushPromises()

    await page.get('[data-review-save]').trigger('click')
    await flushPromises()

    expect(page.get('[data-review-error]').text()).toContain('Choose a rating')
    expect(updateProject).not.toHaveBeenCalled()
  })

  it('saves the rating and the notes', async () => {
    const page = mountTab(ProjectReviewTab)
    await flushPromises()

    await page.get('[data-review-next]').trigger('click')
    await page.get('[data-rate="4"]').trigger('click')
    await page.get('[data-review-next]').trigger('click')
    const notes = page.get('[data-review-notes]')
    await notes.setValue('Clear scope next time.')
    await page.get('[data-review-save]').trigger('click')
    await flushPromises()

    expect(updateProject).toHaveBeenCalledWith('p1', {
      rating: 4,
      retro: 'Clear scope next time.',
    })
    // Saving lands on the summary so the rating is visible as confirmation.
    expect(page.get('[data-review-summary]').text()).toContain('4 / 5')
  })
})

describe('ProjectOverviewTab', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    document.body.innerHTML = ''
    vi.clearAllMocks()
    vi.mocked(toggleMilestone).mockResolvedValue({ id: 'm2', completed: true })
    vi.mocked(removeProjectAttachment).mockResolvedValue(undefined as never)
    const api = await import('./api')
    vi.mocked(api.fetchProjectActivity).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 8,
      pageCount: 1,
    })
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.body.innerHTML = ''
  })

  it('lists the details, the milestone groups and the attachment', async () => {
    const page = mountTab(ProjectOverviewTab)
    await flushPromises()

    expect(page.get('[data-overview-tab]').text()).toContain('Engineering')
    expect(page.findAll('[data-milestone-group]')).toHaveLength(2)
    expect(page.get('[data-attachment="f1"]').text()).toContain('brief.md')
  })

  it('completes every milestone of a day from the group checkbox', async () => {
    const page = mountTab(ProjectOverviewTab)
    await flushPromises()

    const toggle = page.get('[data-milestone-toggle="2026-03-05"]')
    await toggle.trigger('click')
    await flushPromises()

    expect(toggleMilestone).toHaveBeenCalledWith('p1', 'm2', true)
  })

  it('detaches an attachment', async () => {
    const page = mountTab(ProjectOverviewTab)
    await flushPromises()

    await page.get('[data-detach="f1"]').trigger('click')
    await flushPromises()
    expect(removeProjectAttachment).toHaveBeenCalledWith('p1', 'f1')
  })
})
