import type { WorkflowInstance } from '@fish-admin/contracts'
import { Select } from '@fish-admin/vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { i18nReady, setLanguage } from '../../lib/i18n'
import { useAuthStore } from '../../stores/auth'
import { fetchWorkflowInitiators, fetchWorkflows } from './api'
import WorkflowsPage from './WorkflowsPage.vue'

vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>()
  return { ...actual, fetchWorkflows: vi.fn(), fetchWorkflowInitiators: vi.fn() }
})

function instance(id: string, extra: Partial<WorkflowInstance> = {}): WorkflowInstance {
  return {
    id,
    code: `WF-2026-${id}`,
    type: 'purchase',
    title: `Request ${id}`,
    summary: 'A short summary.',
    initiatorId: 'u2',
    status: 'pending',
    amount: 4200,
    form: [{ label: 'Vendor', value: 'Apple' }],
    approverIds: ['u1'],
    currentStep: 0,
    createdAt: '2026-11-16T08:00:00.000Z',
    updatedAt: '2026-11-16T09:00:00.000Z',
    initiatorName: 'Grace Hopper',
    approverNames: ['Ada Lovelace'],
    currentApproverId: 'u1',
    currentApproverName: 'Ada Lovelace',
    commentCount: 0,
    ...extra,
  }
}

const rows = [instance('142'), instance('141', { amount: undefined })]

function pageOf(items: WorkflowInstance[], total = items.length, pageCount = 1) {
  return { items, total, page: 1, pageSize: 10, pageCount }
}

let wrapper: VueWrapper | null = null

function mountPage() {
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
    permissions: ['workflow:read', 'workflow:approve'],
    emailVerified: true,
    twoFactorEnabled: false,
  }
  auth.status = 'authenticated'

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/workflows', name: 'workflows', component: WorkflowsPage },
      { path: '/workflows/:id', name: 'workflow-detail', component: { template: '<div />' } },
    ],
  })
  wrapper = mount(WorkflowsPage, {
    attachTo: document.body,
    global: { plugins: [pinia, router, [VueQueryPlugin, { queryClient }]] },
  })
  return wrapper
}

async function waitForRows(page: VueWrapper) {
  await vi.waitFor(() => expect(page.findAll('[data-workflow-row]')).toHaveLength(2))
}

describe('WorkflowsPage', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    document.body.innerHTML = ''
    vi.clearAllMocks()
    vi.mocked(fetchWorkflows).mockResolvedValue(pageOf(rows, 12, 2))
    vi.mocked(fetchWorkflowInitiators).mockResolvedValue([
      { id: 'u2', name: 'Grace Hopper', email: 'grace@fish.dev' },
    ])
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.body.innerHTML = ''
  })

  it('renders the pending view first with the request table', async () => {
    const page = mountPage()
    await waitForRows(page)

    expect(fetchWorkflows).toHaveBeenCalledWith(
      expect.objectContaining({ view: 'pending', page: 1, pageSize: 10 }),
      expect.anything(),
    )
    expect(page.get('[data-workflow-row]').text()).toContain('Request 142')
    // A request without an amount shows an em dash, not "undefined".
    expect(page.findAll('[data-workflow-row]')[1]!.text()).toContain('—')
    expect(page.get('[data-workflows-total]').text()).toBe('12')
  })

  it('switches the view and returns to the first page', async () => {
    const page = mountPage()
    await waitForRows(page)

    await page.get('[data-view="mine"]').trigger('mousedown')
    await page.get('[data-view="mine"]').trigger('click')
    await vi.waitFor(() =>
      expect(fetchWorkflows).toHaveBeenLastCalledWith(
        expect.objectContaining({ view: 'mine', page: 1 }),
        expect.anything(),
      ),
    )
  })

  it('passes the status filter and clears it again', async () => {
    const page = mountPage()
    await waitForRows(page)

    // Reka's select list lives in a portal opened by pointer events; driving the
    // component's model is the reliable jsdom path, as the users-page tests do.
    page.findAllComponents(Select)[0]!.vm.$emit('update:modelValue', 'approved')
    await vi.waitFor(() =>
      expect(fetchWorkflows).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 'approved', page: 1 }),
        expect.anything(),
      ),
    )

    await page.get('[data-clear-filters]').trigger('click')
    await flushPromises()
    expect(fetchWorkflows).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: undefined, page: 1 }),
      expect.anything(),
    )
  })

  it('debounces the search box', async () => {
    vi.useFakeTimers()
    const page = mountPage()
    await flushPromises()

    await page.get('[data-workflows-search]').setValue('macbook')
    await vi.advanceTimersByTimeAsync(350)
    await flushPromises()

    expect(fetchWorkflows).toHaveBeenLastCalledWith(
      expect.objectContaining({ q: 'macbook', page: 1 }),
      expect.anything(),
    )
    vi.useRealTimers()
  })

  it('changes the page size and resets to page one', async () => {
    const page = mountPage()
    await waitForRows(page)

    // Three filter selects, then the page-size select in the footer.
    page.findAllComponents(Select)[3]!.vm.$emit('update:modelValue', '20')

    await vi.waitFor(() =>
      expect(fetchWorkflows).toHaveBeenLastCalledWith(
        expect.objectContaining({ pageSize: 20, page: 1 }),
        expect.anything(),
      ),
    )
  })

  it('shows the view-specific empty state', async () => {
    vi.mocked(fetchWorkflows).mockResolvedValue(pageOf([], 0))
    const page = mountPage()

    await vi.waitFor(() => expect(page.find('[data-workflows-empty]').exists()).toBe(true))
    expect(page.get('[data-workflows-empty]').text()).toContain('Nothing waiting')
  })
})
