import type { DictionaryDetail, DictionaryItem, DictionaryType } from '@fish-admin/contracts'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '../../lib/api-error'
import { i18nReady, setLanguage } from '../../lib/i18n'
import { useAuthStore } from '../../stores/auth'
import {
  createDictionary,
  createDictionaryItem,
  deleteDictionary,
  deleteDictionaryItem,
  fetchDictionaries,
  fetchDictionary,
  reorderDictionaryItems,
  updateDictionary,
  updateDictionaryItem,
} from './api'
import DictionariesPage from './DictionariesPage.vue'

vi.mock('./api', () => ({
  fetchDictionaries: vi.fn(),
  fetchDictionary: vi.fn(),
  createDictionary: vi.fn(),
  updateDictionary: vi.fn(),
  deleteDictionary: vi.fn(),
  createDictionaryItem: vi.fn(),
  updateDictionaryItem: vi.fn(),
  deleteDictionaryItem: vi.fn(),
  reorderDictionaryItems: vi.fn(),
}))

function dictionaryType(
  id: string,
  code: string,
  name: string,
  extra: Partial<DictionaryType> = {},
): DictionaryType {
  return {
    id,
    code,
    name,
    description: `${name} description`,
    isSystem: false,
    itemCount: 0,
    referenceCount: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  }
}

function dictionaryItem(
  id: string,
  dictionaryId: string,
  label: string,
  value: string,
  extra: Partial<DictionaryItem> = {},
): DictionaryItem {
  return {
    id,
    dictionaryId,
    label,
    value,
    description: '',
    sortOrder: 0,
    enabled: true,
    isSystem: false,
    referenceCount: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  }
}

const userTags = dictionaryType('d1', 'user_tag', 'User tags', {
  isSystem: true,
  itemCount: 3,
  referenceCount: 1,
})
const projectStages = dictionaryType('d2', 'project_stage', 'Project stages', {
  isSystem: false,
  itemCount: 2,
})
const billingCycles = dictionaryType('d3', 'billing_cycle', 'Billing cycles')

const tagItems: DictionaryItem[] = [
  dictionaryItem('i1', 'd1', 'On call', 'on-call', { referenceCount: 1 }),
  dictionaryItem('i2', 'd1', 'Remote', 'remote', { sortOrder: 1 }),
  dictionaryItem('i3', 'd1', 'On site', 'on-site', { sortOrder: 2, isSystem: true }),
]
const stageItems: DictionaryItem[] = [
  dictionaryItem('i4', 'd2', 'Discovery', 'discovery'),
  dictionaryItem('i5', 'd2', 'Delivery', 'delivery', { sortOrder: 1 }),
]

const DETAILS: Record<string, DictionaryDetail> = {
  d1: { dictionary: userTags, items: tagItems },
  d2: { dictionary: projectStages, items: stageItems },
  d3: { dictionary: billingCycles, items: [] },
}

const managePermissions = ['dictionary:read', 'dictionary:manage']

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
  wrapper = mount(DictionariesPage, {
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient }]] },
  })
  return wrapper
}

async function fillField(id: string, value: string) {
  const field = document.body.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${id}`)
  expect(field).toBeTruthy()
  field!.value = value
  field!.dispatchEvent(new Event('input', { bubbles: true }))
  await flushPromises()
}

async function submitDialog() {
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

async function openTypeAction(page: VueWrapper, action: 'delete-type') {
  await page.get(`[data-action="${action}"]`).trigger('click')
  await flushPromises()
}

/** Types the detail endpoint was asked for, in call order. */
function detailRequests() {
  return vi.mocked(fetchDictionary).mock.calls.map(([idOrCode]) => idOrCode)
}

describe('DictionariesPage', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    document.body.innerHTML = ''
    vi.mocked(fetchDictionaries).mockResolvedValue([userTags, projectStages, billingCycles])
    vi.mocked(fetchDictionary).mockImplementation((idOrCode: string) =>
      Promise.resolve(DETAILS[idOrCode] ?? DETAILS.d1!),
    )
    vi.mocked(createDictionary).mockResolvedValue({
      dictionary: dictionaryType('d9', 'cost_center', 'Cost center'),
      items: [],
    })
    vi.mocked(updateDictionary).mockResolvedValue({
      dictionary: projectStages,
      items: stageItems,
    })
    vi.mocked(deleteDictionary).mockResolvedValue(undefined)
    vi.mocked(createDictionaryItem).mockResolvedValue({
      dictionary: projectStages,
      items: stageItems,
    })
    vi.mocked(updateDictionaryItem).mockResolvedValue({
      dictionary: userTags,
      items: tagItems,
    })
    vi.mocked(deleteDictionaryItem).mockResolvedValue(undefined)
    vi.mocked(reorderDictionaryItems).mockResolvedValue({
      dictionary: userTags,
      items: tagItems,
    })
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    queryClient.clear()
    document.body.innerHTML = ''
    vi.clearAllMocks()
  })

  it('selects the first type and renders its items', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('On call'))

    expect(page.text()).toContain('User tags')
    expect(page.text()).toContain('Project stages')
    expect(page.text()).toContain('3 types')
    expect(detailRequests()).toEqual(['d1'])
    const table = page.get('[data-slot="dictionary-items"]')
    expect(table.attributes('aria-label')).toBe('Items')
    expect(table.text()).toContain('on-call')
  })

  it('shows the seeded badge and the wired-up usage line', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('On call'))

    expect(page.text()).toContain('Seeded')
    expect(page.text()).toContain('User profile tag suggestions')
  })

  it('switches the selected type', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('On call'))

    await page.get('[data-type-id="d2"]').trigger('click')
    await vi.waitFor(() => expect(page.text()).toContain('Discovery'))

    expect(detailRequests()).toContain('d2')
    expect(page.get('[data-type-id="d2"]').attributes('aria-pressed')).toBe('true')
    expect(page.get('[data-type-id="d1"]').attributes('aria-pressed')).toBe('false')
    expect(page.text()).toContain('Custom')
  })

  it('creates a type and selects it', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('On call'))
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    await page
      .findAll('button')
      .find((button) => button.text() === 'New type')!
      .trigger('click')
    await flushPromises()
    await fillField('dictionary-code', 'cost_center')
    await fillField('dictionary-name', 'Cost center')
    await submitDialog()

    expect(createDictionary).toHaveBeenCalledWith({
      code: 'cost_center',
      name: 'Cost center',
      description: '',
    })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['dictionaries'] })
    await vi.waitFor(() => expect(page.text()).toContain('Dictionary type created.'))
  })

  it('refuses an invalid code before calling the API', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('On call'))

    await page
      .findAll('button')
      .find((button) => button.text() === 'New type')!
      .trigger('click')
    await flushPromises()
    await fillField('dictionary-code', 'Bad-Code')
    await fillField('dictionary-name', 'Cost center')

    expect(submitButton().disabled).toBe(true)
    await submitDialog()
    expect(createDictionary).not.toHaveBeenCalled()
    expect(document.body.querySelector('[role="alert"]')?.textContent).toContain(
      'Use lowercase letters, digits and underscores',
    )
  })

  it('edits a custom type', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('On call'))

    await page.get('[data-type-id="d2"]').trigger('click')
    await vi.waitFor(() => expect(page.text()).toContain('Discovery'))
    await page
      .findAll('button')
      .find((button) => button.text() === 'Edit type')!
      .trigger('click')
    await flushPromises()
    await fillField('dictionary-name', 'Project phases')
    await submitDialog()

    expect(updateDictionary).toHaveBeenCalledWith('d2', {
      name: 'Project phases',
      description: 'Project stages description',
    })
    await vi.waitFor(() => expect(page.text()).toContain('Dictionary type updated.'))
  })

  it('only offers type editing for custom types', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('On call'))

    expect(page.find('[data-action="delete-type"]').exists()).toBe(false)
    await page.get('[data-type-id="d2"]').trigger('click')
    await vi.waitFor(() => expect(page.text()).toContain('Discovery'))
    expect(page.find('[data-action="delete-type"]').exists()).toBe(true)
  })

  it('blocks deleting a type that still has items', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('On call'))

    await page.get('[data-type-id="d2"]').trigger('click')
    await vi.waitFor(() => expect(page.text()).toContain('Discovery'))
    const button = page.get('[data-action="delete-type"]')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.attributes('title')).toBe('Delete the items first.')
  })

  it('deletes an empty type and converges on the first remaining type', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('On call'))

    await page.get('[data-type-id="d3"]').trigger('click')
    await vi.waitFor(() => expect(page.text()).toContain('Billing cycles'))
    vi.mocked(fetchDictionaries).mockResolvedValue([userTags, projectStages])

    await openTypeAction(page, 'delete-type')
    await submitDialog()

    expect(deleteDictionary).toHaveBeenCalledWith('d3')
    await vi.waitFor(() => expect(page.text()).toContain('Dictionary type deleted.'))
    await vi.waitFor(() => expect(page.get('[aria-pressed="true"]').text()).toContain('User tags'))
    expect(page.text()).toContain('On call')
  })

  it('maps a non-empty delete error', async () => {
    vi.mocked(deleteDictionary).mockRejectedValue(
      new ApiError(409, 'DICTIONARY_NOT_EMPTY', 'not empty'),
    )
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('On call'))

    await page.get('[data-type-id="d3"]').trigger('click')
    await vi.waitFor(() => expect(page.text()).toContain('Billing cycles'))
    await openTypeAction(page, 'delete-type')
    await submitDialog()

    expect(document.body.querySelector('[role="alert"]')?.textContent).toContain(
      'Delete the items first.',
    )
  })

  it('creates an item for the selected type', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('On call'))

    await page.get('[data-type-id="d2"]').trigger('click')
    await vi.waitFor(() => expect(page.text()).toContain('Discovery'))
    await page.get('[data-action="new-item"]').trigger('click')
    await flushPromises()
    await fillField('dictionary-item-label', 'Handover')
    await fillField('dictionary-item-value', 'handover')
    await submitDialog()

    expect(createDictionaryItem).toHaveBeenCalledWith('d2', {
      label: 'Handover',
      value: 'handover',
      description: '',
    })
    await vi.waitFor(() => expect(page.text()).toContain('Item created.'))
  })

  it('refuses an invalid item value before calling the API', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('On call'))

    await page.get('[data-action="new-item"]').trigger('click')
    await flushPromises()
    await fillField('dictionary-item-label', 'Handover')
    await fillField('dictionary-item-value', 'Hand Over')

    expect(submitButton().disabled).toBe(true)
    await submitDialog()
    expect(createDictionaryItem).not.toHaveBeenCalled()
  })

  it('keeps the value read-only for a referenced item', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('On call'))

    await page.get('[data-item-id="i1"][data-action="edit-item"]').trigger('click')
    await flushPromises()

    const value = document.body.querySelector<HTMLInputElement>('#dictionary-item-value')
    expect(value?.disabled).toBe(true)
    await fillField('dictionary-item-label', 'On call only')
    await submitDialog()

    expect(updateDictionaryItem).toHaveBeenCalledWith('d1', 'i1', {
      label: 'On call only',
      description: '',
    })
  })

  it('toggles an item', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('On call'))

    await page.get('[aria-label="Toggle Remote"]').trigger('click')
    await vi.waitFor(() => expect(page.text()).toContain('Item disabled.'))

    expect(updateDictionaryItem).toHaveBeenCalledWith('d1', 'i2', { enabled: false })
  })

  it('reorders items with the arrow keys', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('On call'))

    await page.get('[aria-label="Reorder On call"]').trigger('keydown', { key: 'ArrowDown' })
    await vi.waitFor(() => expect(reorderDictionaryItems).toHaveBeenCalled())

    expect(reorderDictionaryItems).toHaveBeenCalledWith('d1', ['i2', 'i1', 'i3'])
  })

  it('deletes an unreferenced custom item', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('On call'))

    await page.get('[data-item-id="i2"][data-action="delete-item"]').trigger('click')
    await flushPromises()
    await submitDialog()

    expect(deleteDictionaryItem).toHaveBeenCalledWith('d1', 'i2')
    await vi.waitFor(() => expect(page.text()).toContain('Item deleted.'))
  })

  it('disables item deletion for seeded or referenced items', async () => {
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('On call'))

    expect(
      page.get('[data-item-id="i1"][data-action="delete-item"]').attributes('disabled'),
    ).toBeDefined()
    expect(
      page.get('[data-item-id="i3"][data-action="delete-item"]').attributes('disabled'),
    ).toBeDefined()
    expect(
      page.get('[data-item-id="i2"][data-action="delete-item"]').attributes('disabled'),
    ).toBeUndefined()
  })

  it('hides every write control without dictionary:manage', async () => {
    const page = mountPage(['dictionary:read'])
    await vi.waitFor(() => expect(page.text()).toContain('On call'))

    expect(page.findAll('button').find((button) => button.text() === 'New type')).toBeUndefined()
    expect(page.find('[data-action="new-item"]').exists()).toBe(false)
    // React keeps the row actions visible but disabled, so match that instead
    // of hiding them.
    expect(
      page.get('[data-item-id="i2"][data-action="edit-item"]').attributes('disabled'),
    ).toBeDefined()
    expect(
      page.get('[data-item-id="i2"][data-action="delete-item"]').attributes('disabled'),
    ).toBeDefined()
    expect(page.get('[aria-label="Toggle Remote"]').attributes('disabled')).toBeDefined()
    expect(page.get('[aria-label="Reorder On call"]').attributes('disabled')).toBeDefined()
  })

  it('shows the error state and retries', async () => {
    vi.mocked(fetchDictionaries).mockRejectedValue(new Error('boom'))
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('Something went wrong'))

    vi.mocked(fetchDictionaries).mockResolvedValue([userTags, projectStages, billingCycles])
    await page
      .findAll('button')
      .find((button) => button.text().includes('Try again'))!
      .trigger('click')
    await vi.waitFor(() => expect(page.text()).toContain('On call'))
  })

  it('shows the empty state when no types exist', async () => {
    vi.mocked(fetchDictionaries).mockResolvedValue([])
    const page = mountPage()
    await vi.waitFor(() => expect(page.text()).toContain('No dictionary selected'))

    expect(page.text()).toContain('Pick a dictionary type on the left')
    expect(page.findAll('button').find((button) => button.text() === 'New type')).toBeTruthy()
  })
})
