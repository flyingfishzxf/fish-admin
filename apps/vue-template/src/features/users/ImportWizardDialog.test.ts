import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { i18nReady, setLanguage } from '../../lib/i18n'
import { importUsers } from './api'
import ImportWizardDialog from './ImportWizardDialog.vue'

vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>()
  return { ...actual, importUsers: vi.fn() }
})

let wrapper: VueWrapper | null = null
let queryClient: QueryClient

function mountDialog() {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  wrapper = mount(ImportWizardDialog, {
    props: { open: true },
    attachTo: document.body,
    global: { plugins: [[VueQueryPlugin, { queryClient }]] },
  })
  return wrapper
}

function element<T extends HTMLElement = HTMLElement>(selector: string) {
  const node = document.body.querySelector<T>(selector)
  expect(node, `missing ${selector}`).not.toBeNull()
  return node as T
}

async function click(selector: string) {
  element(selector).dispatchEvent(new Event('click', { bubbles: true }))
  await flushPromises()
}

async function pickSample() {
  await click('[data-action="use-sample"]')
}

async function toReview() {
  await click('[data-action="to-review"]')
}

function currentStep() {
  const active = document.body.querySelector('[aria-current="step"]')
  return (
    Array.from(document.body.querySelectorAll('[data-slot="import-steps"] li')).indexOf(
      active as HTMLElement,
    ) + 1
  )
}

describe('ImportWizardDialog', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    document.body.innerHTML = ''
    vi.clearAllMocks()
    vi.mocked(importUsers).mockResolvedValue({
      created: [{ id: 'u1' } as never, { id: 'u2' } as never],
      skipped: [],
    })
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.body.innerHTML = ''
  })

  it('starts on the upload step with four named steps', async () => {
    const page = mountDialog()
    await flushPromises()

    expect(currentStep()).toBe(1)
    expect(document.body.querySelectorAll('[data-slot="import-steps"] li')).toHaveLength(4)
    expect(element('[data-slot="dropzone"]').textContent).toContain('Drop your CSV here')
    expect(page.emitted('finished')).toBeUndefined()
  })

  it('rejects a file with no rows and stays on step one', async () => {
    mountDialog()
    await flushPromises()

    const input = element<HTMLInputElement>('[data-slot="dropzone-file"]')
    const file = new File(['\n\n'], 'empty.csv', { type: 'text/csv' })
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    input.dispatchEvent(new Event('change', { bubbles: true }))
    await flushPromises()
    await flushPromises()

    expect(currentStep()).toBe(1)
    expect(element('[data-slot="dropzone-error"]').textContent).toContain('The file has no rows.')
  })

  it('auto-maps the sample header and previews three rows', async () => {
    mountDialog()
    await flushPromises()
    await pickSample()

    expect(currentStep()).toBe(2)
    expect(element<HTMLSelectElement>('[data-mapping="name"]').value).toBe('0')
    expect(element<HTMLSelectElement>('[data-mapping="email"]').value).toBe('1')
    expect(element<HTMLSelectElement>('[data-mapping="role"]').value).toBe('2')
    expect(element<HTMLSelectElement>('[data-mapping="department"]').value).toBe('3')
    expect(document.body.querySelectorAll('table tbody tr')).toHaveLength(3)
  })

  it('blocks Next when a required column is set to Skip', async () => {
    mountDialog()
    await flushPromises()
    await pickSample()

    const select = element<HTMLSelectElement>('[data-mapping="email"]')
    select.value = '-1'
    select.dispatchEvent(new Event('change', { bubbles: true }))
    await flushPromises()

    expect(element('[data-mapping-error]').textContent).toContain('Email')
    expect(element<HTMLButtonElement>('[data-action="to-review"]').disabled).toBe(true)
  })

  it('counts invalid rows and only submits the valid ones', async () => {
    mountDialog()
    await flushPromises()
    await pickSample()
    await toReview()

    expect(currentStep()).toBe(3)
    expect(document.body.textContent).toContain('3 valid')

    // Replace the sample with a mixed file by going back and re-uploading.
    await click('[data-action="back-map"]')
    await click('[data-action="back-upload"]')
    const input = element<HTMLInputElement>('[data-slot="dropzone-file"]')
    const file = new File(
      ['name,email\nAda,ada@example.com\nRiley,not-an-email\n,grace@example.com\n'],
      'mixed.csv',
      { type: 'text/csv' },
    )
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    input.dispatchEvent(new Event('change', { bubbles: true }))
    await flushPromises()
    await flushPromises()
    await toReview()

    expect(document.body.textContent).toContain('1 valid')
    expect(document.body.textContent).toContain('2 invalid')
    expect(document.body.textContent).toContain('Enter a valid Email.')
    expect(document.body.textContent).toContain('Full name is required.')

    await click('[data-action="submit-import"]')
    expect(importUsers).toHaveBeenCalledWith([
      { name: 'Ada', email: 'ada@example.com', role: undefined, department: undefined },
    ])
  })

  it('shows the done step and reports the counts to the page', async () => {
    const page = mountDialog()
    await flushPromises()
    await pickSample()
    await toReview()
    await click('[data-action="submit-import"]')
    await flushPromises()

    expect(currentStep()).toBe(4)
    expect(element('[data-import-done]').textContent).toContain('2 users are ready.')
    expect(page.emitted('finished')?.[0]?.[0]).toEqual({ created: 2, skipped: 0 })

    await click('[data-action="reset-import"]')
    expect(currentStep()).toBe(1)
  })

  it('keeps the user on review when the server creates nothing', async () => {
    vi.mocked(importUsers).mockResolvedValue({
      created: [],
      skipped: [{ email: 'ada@fish.dev', message: 'duplicate' }],
    })
    const page = mountDialog()
    await flushPromises()
    await pickSample()
    await toReview()
    await click('[data-action="submit-import"]')
    await flushPromises()

    expect(currentStep()).toBe(3)
    expect(element('[data-import-error]').textContent).toContain('No users could be imported.')
    expect(page.emitted('finished')?.[0]?.[0]).toEqual({ created: 0, skipped: 1 })
  })
})
