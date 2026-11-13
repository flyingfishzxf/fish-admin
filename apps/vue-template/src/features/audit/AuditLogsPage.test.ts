import type { AuditEvent, PaginatedResult } from '@fish-admin/contracts'
import { Select } from '@fish-admin/vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { i18nReady, setLanguage } from '../../lib/i18n'
import { fetchAuditEvent, fetchAuditEvents } from './api'
import AuditLogsPage from './AuditLogsPage.vue'
import { auditRangePreset } from './search'

vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>()
  return {
    ...actual,
    fetchAuditEvents: vi.fn(),
    fetchAuditEvent: vi.fn(),
  }
})

function event(id: string, extra: Partial<AuditEvent> = {}): AuditEvent {
  return {
    id,
    action: 'user.updated',
    actorId: 'u1',
    actorName: 'Ada Lovelace',
    entityType: 'user',
    entityId: 'u9',
    entityLabel: 'Grace Hopper',
    metadata: {},
    createdAt: '2026-11-01T10:00:00.000Z',
    ...extra,
  }
}

const firstEvent = event('e1', {
  metadata: { email: 'grace@fish.dev', role: 'Manager' },
})
const secondEvent = event('e2', {
  action: 'role.created',
  actorName: '',
  entityType: 'role',
  entityId: 'r7',
  entityLabel: 'Auditor',
})

function pageOf(
  items: AuditEvent[],
  overrides: Partial<PaginatedResult<AuditEvent>> = {},
): PaginatedResult<AuditEvent> {
  return {
    items,
    total: items.length,
    page: 1,
    pageSize: 20,
    pageCount: 1,
    ...overrides,
  }
}

let wrapper: VueWrapper | null = null
let queryClient: QueryClient

function mountPage() {
  const pinia = createPinia()
  setActivePinia(pinia)
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  wrapper = mount(AuditLogsPage, {
    // Attached so the drawer can be opened from a focused row action and the
    // focus-restoration assertion has somewhere to land.
    attachTo: document.body,
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient }]] },
  })
  return wrapper
}

/** The last query the page sent; the endpoint is server-driven. */
function lastParams() {
  const calls = vi.mocked(fetchAuditEvents).mock.calls
  expect(calls.length).toBeGreaterThan(0)
  return calls[calls.length - 1]![0]
}

describe('AuditLogsPage', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    document.body.innerHTML = ''
    vi.mocked(fetchAuditEvents).mockResolvedValue(pageOf([firstEvent, secondEvent]))
    vi.mocked(fetchAuditEvent).mockResolvedValue({
      event: firstEvent,
      related: [secondEvent],
    })
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    queryClient.clear()
    document.body.innerHTML = ''
    vi.clearAllMocks()
  })

  it('renders every column and asks for the first page', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('Grace Hopper'))

    expect(page.get('[data-slot="table"]').attributes('aria-label')).toBe('Audit log')
    expect(page.text()).toContain('Updated user')
    expect(page.text()).toContain('Ada Lovelace')
    // An event without an actor is attributed to the system.
    expect(page.text()).toContain('System')
    expect(page.text()).toContain('Created role')
    expect(page.text()).toContain('email: grace@fish.dev · role: Manager')
    expect(page.text()).toContain('Page 1 of 1')
    expect(lastParams()).toMatchObject({ page: 1, pageSize: 20 })
  })

  it('searches by text and restarts paging', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('Grace Hopper'))

    await page.get('input[aria-label="Search"]').setValue('grace')
    await vi.waitFor(() => expect(lastParams().q).toBe('grace'))

    expect(lastParams().page).toBe(1)
  })

  it('filters by action', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('Grace Hopper'))

    // The portal popup is covered by the shared Select tests; here the page
    // only has to map the chosen value onto the query parameter.
    page.findAllComponents(Select)[0]!.vm.$emit('update:modelValue', 'role.created')
    await vi.waitFor(() => expect(lastParams().action).toBe('role.created'))
  })

  it('filters by object type', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('Grace Hopper'))

    page.findAllComponents(Select)[1]!.vm.$emit('update:modelValue', 'role')
    await vi.waitFor(() => expect(lastParams().entityType).toBe('role'))
  })

  it('sends a preset date range', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('Grace Hopper'))

    await page.get('[aria-label="Date range: Date range"]').trigger('click')
    await flushPromises()
    const preset = Array.from(document.body.querySelectorAll('button')).find(
      (node) => node.textContent?.trim() === 'Last 7 days',
    )
    expect(preset).toBeTruthy()
    preset!.click()
    await vi.waitFor(() => expect(lastParams().from).toBeTruthy())

    expect(lastParams()).toMatchObject(auditRangePreset('last7'))
  })

  it('clears every filter', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('Grace Hopper'))

    await page.get('input[aria-label="Search"]').setValue('grace')
    await vi.waitFor(() => expect(lastParams().q).toBe('grace'))

    await page
      .findAll('button')
      .find((button) => button.text() === 'Clear filters')!
      .trigger('click')
    await vi.waitFor(() => expect(lastParams().q).toBeUndefined())
    expect(page.get('input[aria-label="Search"]').element).toHaveProperty('value', '')
  })

  it('pages forward with the server page count', async () => {
    vi.mocked(fetchAuditEvents).mockImplementation((params: { page: number }) =>
      Promise.resolve(
        pageOf([firstEvent, secondEvent], { total: 42, page: params.page, pageCount: 3 }),
      ),
    )
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('Page 1 of 3'))

    await page.get('[aria-label="Next page"]').trigger('click')
    await vi.waitFor(() => expect(lastParams().page).toBe(2))

    expect(page.text()).toContain('Showing 21–40 of 42')
  })

  it('follows the page the server clamps to', async () => {
    vi.mocked(fetchAuditEvents).mockResolvedValue(
      pageOf([firstEvent, secondEvent], { total: 42, page: 1, pageCount: 3 }),
    )
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('Page 1 of 3'))

    await page.get('[aria-label="Next page"]').trigger('click')
    await vi.waitFor(() => expect(lastParams().page).toBe(2))

    // The server answers page 1 for a request for page 3, so the pager returns.
    await page.get('[aria-label="Next page"]').trigger('click')
    await vi.waitFor(() => expect(page.text()).toContain('Page 1 of 3'))
  })

  it('opens the drawer with metadata and related events', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('Grace Hopper'))

    await page.get('[data-event-id="e1"]').trigger('click')
    await vi.waitFor(() => expect(fetchAuditEvent).toHaveBeenCalledWith('e1', expect.anything()))

    const drawer = document.body.querySelector<HTMLElement>('[role="dialog"]')
    expect(drawer).toBeTruthy()
    expect(drawer!.textContent).toContain('Event details')
    expect(drawer!.textContent).toContain('Grace Hopper')
    expect(drawer!.textContent).toContain('e1')

    const metadata = drawer!.querySelector('[data-slot="audit-metadata"]')
    expect(metadata?.textContent).toContain('email')
    expect(metadata?.textContent).toContain('grace@fish.dev')
    expect(metadata?.textContent).toContain('role')
    expect(metadata?.textContent).toContain('Manager')
    expect(drawer!.textContent).toContain('Recent events for this object')
    expect(drawer!.textContent).toContain('Created role')
  })

  it('says so when an event carries no metadata', async () => {
    vi.mocked(fetchAuditEvent).mockResolvedValue({ event: secondEvent, related: [] })
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('Grace Hopper'))

    await page.get('[data-event-id="e2"]').trigger('click')
    await vi.waitFor(() =>
      expect(document.body.querySelector('[role="dialog"]')?.textContent).toContain(
        'No metadata recorded.',
      ),
    )
    expect(document.body.querySelector('[data-slot="audit-metadata"]')).toBeNull()
    expect(document.body.querySelector('[role="dialog"]')?.textContent).toContain(
      'No other events for this object.',
    )
  })

  it('closes on Escape and returns focus to the row action', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('Grace Hopper'))

    const trigger = page.get('[data-event-id="e1"]')
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

  it('explains an empty result and offers to clear the filters', async () => {
    vi.mocked(fetchAuditEvents).mockResolvedValue(pageOf([], { total: 0 }))
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('No audit events'))

    expect(page.text()).toContain('Events will appear here as people work')
    expect(
      page.findAll('button').find((button) => button.text() === 'Clear filters'),
    ).toBeUndefined()

    await page.get('input[aria-label="Search"]').setValue('grace')
    await vi.waitFor(() => expect(page.text()).toContain('No events match the current filters.'))
    expect(page.findAll('button').some((button) => button.text() === 'Clear filters')).toBe(true)
  })

  it('shows the error state and retries', async () => {
    vi.mocked(fetchAuditEvents).mockRejectedValue(new Error('boom'))
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('Could not load audit events.'))

    vi.mocked(fetchAuditEvents).mockResolvedValue(pageOf([firstEvent, secondEvent]))
    await page
      .findAll('button')
      .find((button) => button.text().includes('Try again'))!
      .trigger('click')
    await vi.waitFor(() => expect(page.text()).toContain('Grace Hopper'))
  })
})
