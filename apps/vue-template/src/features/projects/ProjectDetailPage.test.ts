import type { ProjectDetail } from '@fish-admin/contracts'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import { ApiError } from '../../lib/api-error'
import { i18nReady, setLanguage } from '../../lib/i18n'
import { useAuthStore } from '../../stores/auth'
import {
  archiveProject,
  fetchProject,
  fetchProjectActivity,
  fetchProjectUserOptions,
  toggleMilestone,
} from './api'
import ProjectDetailPage from './ProjectDetailPage.vue'

vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>()
  return {
    ...actual,
    fetchProject: vi.fn(),
    archiveProject: vi.fn(),
    fetchProjectActivity: vi.fn(),
    fetchProjectUserOptions: vi.fn(),
    toggleMilestone: vi.fn(),
    removeProjectAttachment: vi.fn(),
    createProjectTask: vi.fn(),
    updateProjectTask: vi.fn(),
    updateProject: vi.fn(),
  }
})

const detail: ProjectDetail = {
  project: {
    id: 'p1',
    name: 'Atlas Design System',
    key: 'ATL',
    description: 'A shared component library.',
    status: 'active',
    priority: 'high',
    ownerId: 'u1',
    memberIds: ['u1', 'u2'],
    tags: ['design-system'],
    budget: 48000,
    spent: 26400,
    budgetItems: [{ id: 'b1', label: 'Design', amount: 12000 }],
    attachmentIds: [],
    progress: 58,
    startDate: '2026-08-01T00:00:00.000Z',
    dueDate: '2026-12-10T00:00:00.000Z',
    featured: true,
    archived: false,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
    ownerName: 'Ada Lovelace',
    memberNames: ['Ada Lovelace', 'Grace Hopper'],
    departmentName: 'Engineering',
    taskCounts: { todo: 0, doing: 0, review: 0, done: 0 },
  },
  tasks: [],
  milestones: [],
  attachments: [],
}

let wrapper: VueWrapper | null = null
let router: Router

async function mountPage(permissions = ['project:read', 'project:manage']) {
  const pinia = createPinia()
  setActivePinia(pinia)
  // eslint-disable-next-line react-hooks/rules-of-hooks -- Pinia store, not a React hook.
  const auth = useAuthStore()
  auth.user = {
    id: 'u1',
    name: 'Ada Lovelace',
    email: 'ada@fish.dev',
    roleId: 'r1',
    roleName: 'Admin',
    permissions,
    emailVerified: true,
    twoFactorEnabled: false,
  }
  auth.status = 'authenticated'

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/projects', name: 'projects', component: { template: '<div>list</div>' } },
      { path: '/projects/:id', name: 'project-detail', component: ProjectDetailPage },
    ],
  })
  await router.push('/projects/p1')
  await router.isReady()

  wrapper = mount(ProjectDetailPage, {
    attachTo: document.body,
    global: { plugins: [pinia, router, [VueQueryPlugin, { queryClient }]] },
  })
  return wrapper
}

describe('ProjectDetailPage', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    document.body.innerHTML = ''
    vi.clearAllMocks()
    vi.mocked(fetchProject).mockResolvedValue(detail)
    vi.mocked(fetchProjectUserOptions).mockResolvedValue([])
    vi.mocked(fetchProjectActivity).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 8,
      pageCount: 1,
    })
    vi.mocked(toggleMilestone).mockResolvedValue({ id: 'm1', completed: true })
    vi.mocked(archiveProject).mockResolvedValue(detail.project)
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.body.innerHTML = ''
  })

  it('renders the header and the four tabs', async () => {
    const page = await mountPage()
    await vi.waitFor(() =>
      expect(page.get('[data-project-name]').text()).toBe('Atlas Design System'),
    )

    expect(page.text()).toContain('Engineering')
    expect(page.findAll('[data-slot="tabs-trigger"]')).toHaveLength(4)
    expect(page.get('[data-overview-tab]').exists()).toBe(true)
  })

  it('keeps a missing project inside the shell with a way back', async () => {
    vi.mocked(fetchProject).mockRejectedValue(new ApiError(404, 'PROJECT_NOT_FOUND', 'Not found.'))
    const page = await mountPage()

    await vi.waitFor(() => expect(page.find('[data-project-not-found]').exists()).toBe(true))
    await page.get('[data-project-not-found] button').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('projects')
  })

  it('switches to the budget tab', async () => {
    const page = await mountPage()
    await vi.waitFor(() => expect(page.find('[data-project-name]').exists()).toBe(true))

    // Reka activates a tab on pointer down as well as click; jsdom needs both.
    const budgetTab = page.findAll('[data-slot="tabs-trigger"]')[2]!
    await budgetTab.trigger('mousedown')
    await budgetTab.trigger('click')
    await flushPromises()

    expect(page.find('[data-budget-tab]').exists()).toBe(true)
    expect(page.get('[data-budget-tab]').text()).toContain('Remaining')
  })

  it('hides every write action from a read-only role', async () => {
    const page = await mountPage(['project:read'])
    await vi.waitFor(() => expect(page.find('[data-project-name]').exists()).toBe(true))

    expect(page.find('[data-archive-project]').exists()).toBe(false)
    await page.findAll('[data-slot="tabs-trigger"]')[1]!.trigger('click')
    await flushPromises()
    expect(page.find('[data-add-task]').exists()).toBe(false)
  })

  it('archives from the header dialog and returns to the list', async () => {
    const page = await mountPage()
    await vi.waitFor(() => expect(page.find('[data-project-name]').exists()).toBe(true))

    await page.get('[data-archive-project]').trigger('click')
    await flushPromises()
    const dialog = document.body.querySelector('[role="alertdialog"]')!
    const confirm = Array.from(dialog.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Archive',
    )!
    confirm.dispatchEvent(new Event('click', { bubbles: true }))
    await flushPromises()

    expect(archiveProject).toHaveBeenCalledWith('p1')
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('projects'))
  })
})
