import type { Integration, IntegrationDelivery, PaginatedResult } from '@fish-admin/contracts'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { i18nReady, setLanguage } from '../../lib/i18n'
import { useAuthStore } from '../../stores/auth'
import {
  createIntegration,
  deleteIntegration,
  fetchIntegrationDeliveries,
  fetchIntegrations,
  fetchRecentDeliveries,
  retryDelivery,
  updateIntegration,
} from './api'
import IntegrationsPage from './IntegrationsPage.vue'

vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>()
  return {
    ...actual,
    fetchIntegrations: vi.fn(),
    fetchRecentDeliveries: vi.fn(),
    fetchIntegrationDeliveries: vi.fn(),
    createIntegration: vi.fn(),
    updateIntegration: vi.fn(),
    deleteIntegration: vi.fn(),
    retryDelivery: vi.fn(),
  }
})

function integration(id: string, name: string, extra: Partial<Integration> = {}): Integration {
  return {
    id,
    name,
    provider: 'Slack',
    endpoint: `https://hooks.example.com/${id}`,
    event: 'project.created',
    mode: 'immediate',
    enabled: true,
    headers: [],
    secretPreview: 'xoxb_••••1234',
    createdAt: '2026-11-01T10:00:00.000Z',
    ...extra,
  }
}

function delivery(
  id: string,
  integrationId: string,
  extra: Partial<IntegrationDelivery> = {},
): IntegrationDelivery {
  return {
    id,
    integrationId,
    event: 'project.created',
    status: 'success',
    statusCode: 200,
    durationMs: 120,
    payload: { data: { attempt: 1 } },
    createdAt: '2026-11-02T09:00:00.000Z',
    ...extra,
  }
}

const billing = integration('i1', 'Billing alerts', {
  headers: [{ id: 'h1', key: 'X-Signature', value: 'abc' }],
  lastDeliveryAt: '2026-11-02T09:00:00.000Z',
})
const deploy = integration('i2', 'Deploy hooks', {
  provider: 'GitHub',
  event: 'project.archived',
  mode: 'digest',
  enabled: false,
})

const deliveries = [
  delivery('d1', 'i1'),
  delivery('d2', 'i1', { status: 'failed', statusCode: 500, durationMs: 320 }),
]

function listOf(
  items: Integration[],
  overrides: Partial<PaginatedResult<Integration>> = {},
): PaginatedResult<Integration> {
  return { items, total: items.length, page: 1, pageSize: 6, pageCount: 1, ...overrides }
}

const managePermissions = ['integration:read', 'integration:manage']

let wrapper: VueWrapper | null = null
let queryClient: QueryClient

function mountPage(permissions: string[] = managePermissions) {
  const pinia = createPinia()
  setActivePinia(pinia)
  // eslint-disable-next-line react-hooks/rules-of-hooks -- Pinia store, not a React hook.
  const auth = useAuthStore()
  auth.user = {
    id: 'admin',
    name: 'Admin',
    email: 'admin@fish.dev',
    roleId: 'r1',
    roleName: 'Admin',
    permissions,
    emailVerified: true,
    twoFactorEnabled: false,
  }
  auth.status = 'authenticated'
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  wrapper = mount(IntegrationsPage, {
    // Attached so the drawers can hand focus back to a focused trigger.
    attachTo: document.body,
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient }]] },
  })
  return wrapper
}

async function fillField(id: string, value: string) {
  const field = document.body.querySelector<HTMLInputElement>(`#${id}`)
  expect(field).toBeTruthy()
  field!.value = value
  field!.dispatchEvent(new Event('input', { bubbles: true }))
  await flushPromises()
}

async function submitForm() {
  const form = document.body.querySelector<HTMLFormElement>('form')
  expect(form).toBeTruthy()
  form!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  await flushPromises()
}

function submitButton() {
  const button = document.body.querySelector<HTMLButtonElement>('button[type="submit"]')
  expect(button).toBeTruthy()
  return button!
}

/** Drawers teleport out of the component tree, so their buttons live in body. */
function buttonInBody(text: string) {
  const button = Array.from(document.body.querySelectorAll('button')).find(
    (candidate) => candidate.textContent?.trim() === text,
  )
  expect(button).toBeTruthy()
  return button!
}

function lastParams() {
  const calls = vi.mocked(fetchIntegrations).mock.calls
  expect(calls.length).toBeGreaterThan(0)
  return calls[calls.length - 1]![0]
}

describe('IntegrationsPage', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    document.body.innerHTML = ''
    vi.mocked(fetchIntegrations).mockResolvedValue(listOf([billing, deploy]))
    vi.mocked(fetchRecentDeliveries).mockResolvedValue({
      items: [{ ...deliveries[0]!, integrationName: 'Billing alerts' }],
      total: 1,
    })
    vi.mocked(fetchIntegrationDeliveries).mockResolvedValue({
      integrationId: 'i1',
      items: deliveries,
    })
    vi.mocked(createIntegration).mockResolvedValue(integration('i9', 'New connection'))
    vi.mocked(updateIntegration).mockResolvedValue(billing)
    vi.mocked(deleteIntegration).mockResolvedValue(undefined)
    vi.mocked(retryDelivery).mockResolvedValue(delivery('d3', 'i1'))
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    queryClient.clear()
    document.body.innerHTML = ''
    vi.clearAllMocks()
  })

  it('renders each connection with its routing details', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('Billing alerts'))

    expect(page.text()).toContain('https://hooks.example.com/i1')
    expect(page.text()).toContain('Project created')
    expect(page.text()).toContain('Immediate')
    expect(page.text()).toContain('Digest')
    expect(page.text()).toContain('Disabled')
    expect(page.text()).toContain('xoxb_••••1234')
    expect(page.text()).toContain('2 connections')
    expect(page.text()).toContain('Page 1 of 1')
    expect(lastParams()).toMatchObject({ page: 1, pageSize: 6 })
  })

  it('filters by provider and status', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('Billing alerts'))

    page.findAllComponents({ name: 'Select' })[0]!.vm.$emit('update:modelValue', 'GitHub')
    await vi.waitFor(() => expect(lastParams().provider).toBe('GitHub'))

    page.findAllComponents({ name: 'Select' })[1]!.vm.$emit('update:modelValue', 'disabled')
    await vi.waitFor(() => expect(lastParams().enabled).toBe(false))
  })

  it('clears the filters', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('Billing alerts'))

    page.findAllComponents({ name: 'Select' })[0]!.vm.$emit('update:modelValue', 'GitHub')
    await vi.waitFor(() => expect(lastParams().provider).toBe('GitHub'))

    await page
      .findAll('button')
      .find((button) => button.text() === 'Clear filter')!
      .trigger('click')
    await vi.waitFor(() => expect(lastParams().provider).toBeUndefined())
    expect(lastParams().enabled).toBeUndefined()
  })

  it('creates a connection', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('Billing alerts'))
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    await page.get('[data-action="new-integration"]').trigger('click')
    await flushPromises()
    await fillField('integration-name', 'Invoice alerts')
    await fillField('integration-endpoint', 'https://hooks.example.com/invoices')
    await submitForm()

    expect(createIntegration).toHaveBeenCalledWith({
      name: 'Invoice alerts',
      provider: 'Slack',
      endpoint: 'https://hooks.example.com/invoices',
      event: 'project.created',
      mode: 'immediate',
      enabled: false,
      headers: [],
    })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['integrations'] })
    await vi.waitFor(() => expect(page.text()).toContain('Connection created.'))
  })

  it('refuses a non-HTTPS endpoint before calling the API', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('Billing alerts'))

    await page.get('[data-action="new-integration"]').trigger('click')
    await flushPromises()
    await fillField('integration-name', 'Invoice alerts')
    await fillField('integration-endpoint', 'http://hooks.example.com/invoices')

    expect(submitButton().disabled).toBe(true)
    await submitForm()
    expect(createIntegration).not.toHaveBeenCalled()
  })

  it('refuses an invalid header name before calling the API', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('Billing alerts'))

    await page.get('[data-action="new-integration"]').trigger('click')
    await flushPromises()
    await fillField('integration-name', 'Invoice alerts')
    await fillField('integration-endpoint', 'https://hooks.example.com/invoices')
    buttonInBody('Add header').click()
    await flushPromises()

    const key = document.body.querySelectorAll<HTMLInputElement>('input[aria-label="Header"]')[0]
    expect(key).toBeTruthy()
    key!.value = 'x signature'
    key!.dispatchEvent(new Event('input', { bubbles: true }))
    await submitForm()

    expect(createIntegration).not.toHaveBeenCalled()
    expect(document.body.querySelector('[role="alert"]')?.textContent).toContain(
      'Header names allow letters, numbers and dashes.',
    )
  })

  it('edits a connection without dropping its headers', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('Billing alerts'))

    await page.get('[data-integration-id="i1"][data-action="edit-integration"]').trigger('click')
    await flushPromises()
    await fillField('integration-name', 'Billing alerts v2')
    await submitForm()

    expect(updateIntegration).toHaveBeenCalledWith(
      'i1',
      expect.objectContaining({
        name: 'Billing alerts v2',
        headers: [{ id: 'h1', key: 'X-Signature', value: 'abc' }],
      }),
    )
    await vi.waitFor(() => expect(page.text()).toContain('Connection updated.'))
  })

  it('toggles a connection', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('Billing alerts'))

    await page.get('[aria-label="Toggle Billing alerts"]').trigger('click')
    await vi.waitFor(() => expect(page.text()).toContain('Connection disabled.'))

    expect(updateIntegration).toHaveBeenCalledWith('i1', { enabled: false })
  })

  it('deletes a connection after confirming', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('Billing alerts'))

    await page.get('[data-integration-id="i1"][data-action="delete-integration"]').trigger('click')
    await flushPromises()
    const dialog = document.body.querySelector<HTMLElement>('[role="dialog"]')
    expect(dialog?.textContent).toContain('Delete Billing alerts?')
    buttonInBody('Delete').click()
    await flushPromises()

    expect(deleteIntegration).toHaveBeenCalledWith('i1')
    await vi.waitFor(() => expect(page.text()).toContain('Connection deleted.'))
  })

  it('reports a failed delete', async () => {
    vi.mocked(deleteIntegration).mockRejectedValue(new Error('boom'))
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('Billing alerts'))

    await page.get('[data-integration-id="i1"][data-action="delete-integration"]').trigger('click')
    await flushPromises()
    buttonInBody('Delete').click()
    await vi.waitFor(() =>
      expect(page.get('[role="alert"]').text()).toContain('Could not delete this connection.'),
    )
  })

  it('opens the delivery history with the recorded attempts', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('Billing alerts'))

    await page.get('[data-integration-id="i1"][data-action="open-deliveries"]').trigger('click')
    await vi.waitFor(() => expect(fetchIntegrationDeliveries).toHaveBeenCalled())

    const drawer = document.body.querySelector<HTMLElement>('[role="dialog"]')
    expect(drawer?.textContent).toContain('Deliveries · Billing alerts')
    expect(drawer?.textContent).toContain('Delivered')
    expect(drawer?.textContent).toContain('Delivery failed')
    expect(drawer?.querySelector('[data-delivery-id="d2"]')?.textContent).toContain('HTTP 500')
  })

  it('replays a delivery and refreshes the page data', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('Billing alerts'))
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    await page.get('[data-integration-id="i1"][data-action="open-deliveries"]').trigger('click')
    await vi.waitFor(() => expect(fetchIntegrationDeliveries).toHaveBeenCalled())

    const retry = document.body.querySelector<HTMLElement>('[data-action="retry-delivery"]')
    expect(retry).toBeTruthy()
    retry!.click()
    await flushPromises()

    expect(retryDelivery).toHaveBeenCalledWith('i1', 'd1')
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain('Delivery replayed successfully.'),
    )
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['integrations'] })
  })

  it('reports a failed replay', async () => {
    vi.mocked(retryDelivery).mockRejectedValue(new Error('boom'))
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('Billing alerts'))

    await page.get('[data-integration-id="i1"][data-action="open-deliveries"]').trigger('click')
    await vi.waitFor(() => expect(fetchIntegrationDeliveries).toHaveBeenCalled())

    document.body.querySelector<HTMLElement>('[data-action="retry-delivery"]')!.click()
    await vi.waitFor(() =>
      expect(document.body.querySelector('[role="alert"]')?.textContent).toContain(
        'Could not replay this delivery.',
      ),
    )
  })

  it('closes the delivery drawer on Escape and returns focus', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('Billing alerts'))

    const trigger = page.get('[data-integration-id="i1"][data-action="open-deliveries"]')
    ;(trigger.element as HTMLElement).focus()
    await trigger.trigger('click')
    await flushPromises()
    expect(document.body.querySelector('[role="dialog"]')).toBeTruthy()

    document.body
      .querySelector<HTMLElement>('[role="dialog"]')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await flushPromises()

    await vi.waitFor(() => expect(document.body.querySelector('[role="dialog"]')).toBeNull())
    await vi.waitFor(() => expect(document.activeElement).toBe(trigger.element))
  })

  it('shows an empty state with a reset action', async () => {
    vi.mocked(fetchIntegrations).mockResolvedValue(listOf([], { total: 0 }))
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('No connections match these filters'))

    await page
      .findAll('button')
      .find((button) => button.text() === 'Reset filters')!
      .trigger('click')
    await vi.waitFor(() => expect(lastParams().provider).toBeUndefined())
  })

  it('shows the error state and retries', async () => {
    vi.mocked(fetchIntegrations).mockRejectedValue(new Error('boom'))
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('Something went wrong'))

    vi.mocked(fetchIntegrations).mockResolvedValue(listOf([billing, deploy]))
    await page
      .findAll('button')
      .find((button) => button.text().includes('Try again'))!
      .trigger('click')
    await vi.waitFor(() => expect(page.text()).toContain('Billing alerts'))
  })

  it('hides every write control without integration:manage', async () => {
    const page = mountPage(['integration:read'])
    await vi.waitFor(() => expect(page.text()).toContain('Billing alerts'))

    expect(page.find('[data-action="new-integration"]').exists()).toBe(false)
    expect(page.find('[data-action="edit-integration"]').exists()).toBe(false)
    expect(page.find('[data-action="delete-integration"]').exists()).toBe(false)
    expect(page.find('[aria-label="Toggle Billing alerts"]').exists()).toBe(false)
    // Delivery history stays readable.
    expect(page.find('[data-action="open-deliveries"]').exists()).toBe(true)
  })
})
