import type { WorkflowDetail } from '@fish-admin/contracts'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import { ApiError } from '../../lib/api-error'
import { i18nReady, setLanguage } from '../../lib/i18n'
import { useAuthStore } from '../../stores/auth'
import { addWorkflowComment, decideWorkflow, fetchWorkflow, fetchWorkflowApprovers } from './api'
import WorkflowDetailPage from './WorkflowDetailPage.vue'

vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>()
  return {
    ...actual,
    fetchWorkflow: vi.fn(),
    fetchWorkflowApprovers: vi.fn(),
    decideWorkflow: vi.fn(),
    addWorkflowComment: vi.fn(),
  }
})

function detail(extra: Partial<WorkflowDetail['instance']> = {}): WorkflowDetail {
  return {
    instance: {
      id: 'w1',
      code: 'WF-2026-0142',
      type: 'purchase',
      title: 'MacBook Pro for the design team',
      summary: 'Two laptops for the incoming designers.',
      initiatorId: 'u2',
      status: 'pending',
      amount: 4200,
      form: [{ label: 'Vendor', value: 'Apple Business' }],
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
    },
    steps: [
      {
        id: 's1',
        instanceId: 'w1',
        action: 'submitted',
        actorId: 'u2',
        actorName: 'Grace Hopper',
        approverId: 'u1',
        approverName: 'Ada Lovelace',
        comment: 'Please review before Friday.',
        createdAt: '2026-11-16T08:00:00.000Z',
      },
    ],
    comments: [
      {
        id: 'c1',
        instanceId: 'w1',
        authorId: 'u2',
        authorName: 'Grace Hopper',
        body: 'Added the invoice.',
        createdAt: '2026-11-16T08:30:00.000Z',
      },
    ],
  }
}

let wrapper: VueWrapper | null = null
let router: Router

async function mountPage(permissions = ['workflow:read', 'workflow:approve']) {
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
      { path: '/workflows', name: 'workflows', component: { template: '<div>list</div>' } },
      { path: '/workflows/:id', name: 'workflow-detail', component: WorkflowDetailPage },
    ],
  })
  await router.push('/workflows/w1')
  await router.isReady()

  wrapper = mount(WorkflowDetailPage, {
    attachTo: document.body,
    global: { plugins: [pinia, router, [VueQueryPlugin, { queryClient }]] },
  })
  return wrapper
}

describe('WorkflowDetailPage', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    document.body.innerHTML = ''
    vi.clearAllMocks()
    vi.mocked(fetchWorkflow).mockResolvedValue(detail())
    vi.mocked(fetchWorkflowApprovers).mockResolvedValue([
      { id: 'u1', name: 'Ada Lovelace', department: 'Engineering' },
      { id: 'u3', name: 'Alan Turing', department: 'Engineering' },
    ])
    vi.mocked(decideWorkflow).mockResolvedValue(detail({ status: 'approved' }))
    vi.mocked(addWorkflowComment).mockResolvedValue([])
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.body.innerHTML = ''
  })

  it('renders the header, the form, the timeline and the snapshot', async () => {
    const page = await mountPage()
    await vi.waitFor(() =>
      expect(page.get('[data-workflow-title]').text()).toBe('MacBook Pro for the design team'),
    )

    expect(page.get('[data-workflow-form]').text()).toContain('Apple Business')
    expect(page.get('[data-workflow-snapshot]').text()).toContain('createdAt')
    expect(page.findAll('[data-slot="timeline-item"]')).toHaveLength(1)
    expect(page.get('[data-workflow-comments]').text()).toContain('Added the invoice.')
  })

  it('keeps a missing request inside the shell', async () => {
    vi.mocked(fetchWorkflow).mockRejectedValue(new ApiError(404, 'NOT_FOUND', 'Gone.'))
    const page = await mountPage()

    await vi.waitFor(() => expect(page.find('[data-workflow-not-found]').exists()).toBe(true))
    await page.get('[data-workflow-not-found] button').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('workflows')
  })

  it('shows the decision panel to the approver it waits on', async () => {
    const page = await mountPage()
    await vi.waitFor(() => expect(page.find('[data-workflow-title]').exists()).toBe(true))
    expect(page.find('[data-decision-panel]').exists()).toBe(true)
  })

  it('hides the panel from everyone else', async () => {
    vi.mocked(fetchWorkflow).mockResolvedValue(detail({ currentApproverId: 'u3' }))
    const page = await mountPage()
    await vi.waitFor(() => expect(page.find('[data-workflow-title]').exists()).toBe(true))
    expect(page.find('[data-decision-panel]').exists()).toBe(false)
  })

  it('hides the panel without the approve permission', async () => {
    const page = await mountPage(['workflow:read'])
    await vi.waitFor(() => expect(page.find('[data-workflow-title]').exists()).toBe(true))
    expect(page.find('[data-decision-panel]').exists()).toBe(false)
  })

  it('approves through the confirm dialog with the note attached', async () => {
    const page = await mountPage()
    await vi.waitFor(() => expect(page.find('[data-decision-panel]').exists()).toBe(true))

    await page.get('[data-decision-note]').setValue('Approved for the Q4 budget.')
    await page.get('[data-approve]').trigger('click')
    await flushPromises()

    const dialog = document.body.querySelector('[role="alertdialog"]')!
    expect(dialog.textContent).toContain('Approve this request?')
    const confirm = Array.from(dialog.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Approve',
    )!
    confirm.dispatchEvent(new Event('click', { bubbles: true }))
    await flushPromises()

    expect(decideWorkflow).toHaveBeenCalledWith('w1', {
      decision: 'approve',
      comment: 'Approved for the Q4 budget.',
      transferToId: undefined,
    })
  })

  it('adds a comment', async () => {
    const page = await mountPage()
    await vi.waitFor(() => expect(page.find('[data-comment-input]').exists()).toBe(true))

    const input = page.get('[data-comment-input]')
    await input.setValue('Checked with finance.')
    await page.get('[data-comment-submit]').trigger('click')
    await flushPromises()

    expect(addWorkflowComment).toHaveBeenCalledWith('w1', 'Checked with finance.')
    expect((input.element as HTMLTextAreaElement).value).toBe('')
  })
})
