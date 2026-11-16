import type { Project } from '@fish-admin/contracts'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import { i18nReady, setLanguage } from '../../lib/i18n'
import { useAuthStore } from '../../stores/auth'
import {
  archiveProject,
  fetchProjectDepartments,
  fetchProjects,
  fetchProjectUserOptions,
} from './api'
import ProjectsPage from './ProjectsPage.vue'

vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>()
  return {
    ...actual,
    fetchProjects: vi.fn(),
    fetchProjectDepartments: vi.fn(),
    fetchProjectUserOptions: vi.fn(),
    archiveProject: vi.fn(),
    createProject: vi.fn(),
  }
})

function project(id: string, name: string, extra: Partial<Project> = {}): Project {
  return {
    id,
    name,
    key: name.slice(0, 3).toUpperCase(),
    description: `${name} description`,
    status: 'active',
    priority: 'high',
    ownerId: 'u1',
    memberIds: ['u1', 'u2'],
    tags: ['design'],
    budget: 48000,
    spent: 26400,
    budgetItems: [],
    attachmentIds: [],
    progress: 58,
    startDate: '2026-08-01T00:00:00.000Z',
    dueDate: '2026-12-10T00:00:00.000Z',
    featured: id === 'p1',
    archived: false,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
    ownerName: 'Ada Lovelace',
    memberNames: ['Ada Lovelace', 'Grace Hopper'],
    taskCounts: { todo: 2, doing: 1, review: 0, done: 3 },
    ...extra,
  }
}

const projects = [project('p1', 'Atlas'), project('p2', 'Billing', { priority: 'low' })]

function pageOf(items: Project[], total = items.length, pageCount = 1) {
  return { items, total, page: 1, pageSize: 6, pageCount }
}

let wrapper: VueWrapper | null = null
let router: Router

function mountPage(permissions = ['project:read', 'project:manage']) {
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
      { path: '/projects', name: 'projects', component: ProjectsPage },
      { path: '/projects/:id', name: 'project-detail', component: { template: '<div />' } },
    ],
  })
  wrapper = mount(ProjectsPage, {
    attachTo: document.body,
    global: { plugins: [pinia, router, [VueQueryPlugin, { queryClient }]] },
  })
  return wrapper
}

async function waitForCards(page: VueWrapper) {
  await vi.waitFor(() => expect(page.findAll('[data-project-card]')).toHaveLength(2))
}

describe('ProjectsPage', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    document.body.innerHTML = ''
    vi.clearAllMocks()
    vi.mocked(fetchProjects).mockImplementation(async (params) =>
      params.archived ? pageOf([], 0) : pageOf(projects),
    )
    vi.mocked(fetchProjectUserOptions).mockResolvedValue([
      { id: 'u1', name: 'Ada Lovelace', email: 'ada@fish.dev', department: 'Engineering' },
    ])
    vi.mocked(fetchProjectDepartments).mockResolvedValue({ items: [] })
    vi.mocked(archiveProject).mockResolvedValue(projects[0] as never)
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.body.innerHTML = ''
  })

  it('renders the portfolio KPI, the featured strip and the board', async () => {
    const page = mountPage()
    await waitForCards(page)

    expect(page.findAll('[data-stat]')).toHaveLength(4)
    expect(page.get('[data-stat="active"]').text()).toContain('2')
    expect(page.get('[data-stat="budget"]').text()).toContain('96,000')
    expect(page.get('[data-stat="completion"]').text()).toContain('58')
    // Only the featured project gets a highlight card.
    expect(page.findAll('[data-featured-project]')).toHaveLength(1)
    expect(page.get('[data-result-total]').text()).toContain('2')
  })

  it('switches to the list view without a new request', async () => {
    const page = mountPage()
    await waitForCards(page)
    const calls = vi.mocked(fetchProjects).mock.calls.length

    await page.findAll('[data-view-switch] button')[1]!.trigger('click')
    await flushPromises()

    expect(page.find('[data-project-table]').exists()).toBe(true)
    expect(page.findAll('[data-project-row]')).toHaveLength(2)
    expect(vi.mocked(fetchProjects).mock.calls.length).toBe(calls)
  })

  it('sorts through the server when a table header is clicked', async () => {
    const page = mountPage()
    await waitForCards(page)
    await page.findAll('[data-view-switch] button')[1]!.trigger('click')

    await page.get('[data-sort="progress"]').trigger('click')
    await vi.waitFor(() =>
      expect(fetchProjects).toHaveBeenLastCalledWith(
        expect.objectContaining({ sort: 'progress', order: 'asc', page: 1 }),
        expect.anything(),
      ),
    )

    await page.get('[data-sort="progress"]').trigger('click')
    await vi.waitFor(() =>
      expect(fetchProjects).toHaveBeenLastCalledWith(
        expect.objectContaining({ sort: 'progress', order: 'desc' }),
        expect.anything(),
      ),
    )
  })

  it('filters by archived and shows the empty state', async () => {
    const page = mountPage()
    await waitForCards(page)

    await page.get('[data-filters-archived]').trigger('click')
    await vi.waitFor(() => expect(page.text()).toContain('No projects yet'))
    expect(fetchProjects).toHaveBeenLastCalledWith(
      expect.objectContaining({ archived: true, page: 1 }),
      expect.anything(),
    )
  })

  it('debounces the search box into the query', async () => {
    vi.useFakeTimers()
    const page = mountPage()
    await flushPromises()

    await page.get('[data-filters-search]').setValue('atlas')
    await vi.advanceTimersByTimeAsync(350)
    await flushPromises()

    expect(fetchProjects).toHaveBeenLastCalledWith(
      expect.objectContaining({ q: 'atlas', page: 1 }),
      expect.anything(),
    )
    vi.useRealTimers()
  })

  it('archives a project after confirmation', async () => {
    const page = mountPage()
    await waitForCards(page)

    await page.get('[data-project-archive]').trigger('click')
    await flushPromises()
    expect(document.body.textContent).toContain('Archive Atlas?')

    const dialog = document.body.querySelector('[role="alertdialog"]')!
    const confirm = Array.from(dialog.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Archive',
    )!
    confirm.dispatchEvent(new Event('click', { bubbles: true }))
    await flushPromises()

    expect(archiveProject).toHaveBeenCalledWith('p1')
  })

  it('offers no write affordance to a read-only role', async () => {
    const page = mountPage(['project:read'])
    await waitForCards(page)

    expect(page.find('[data-new-project]').exists()).toBe(false)
    expect(page.find('[data-project-archive]').exists()).toBe(false)
  })
})
