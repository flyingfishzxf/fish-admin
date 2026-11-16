import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { i18nReady, setLanguage } from '../../lib/i18n'
import { uploadFile } from './api'
import FileUploadDialog from './FileUploadDialog.vue'

vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>()
  return { ...actual, uploadFile: vi.fn() }
})

const folders = [
  { id: 'folder-design', name: 'Design', parentId: null, fileCount: 0 },
  { id: 'folder-brand', name: 'Brand', parentId: 'folder-design', fileCount: 0 },
]

let wrapper: VueWrapper | null = null

function mountDialog() {
  wrapper = mount(FileUploadDialog, {
    props: { open: true, folders },
    attachTo: document.body,
    global: {
      plugins: [
        [
          VueQueryPlugin,
          { queryClient: new QueryClient({ defaultOptions: { mutations: { retry: false } } }) },
        ],
      ],
    },
  })
  return wrapper
}

async function drop(files: File[]) {
  const input = document.body.querySelector<HTMLInputElement>('[data-slot="dropzone-file"]')!
  Object.defineProperty(input, 'files', { value: files, configurable: true })
  input.dispatchEvent(new Event('change', { bubbles: true }))
  await flushPromises()
}

function rows(status: string) {
  return document.body.querySelectorAll(`[data-upload-row="${status}"]`)
}

describe('FileUploadDialog', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    document.body.innerHTML = ''
    vi.clearAllMocks()
    vi.mocked(uploadFile).mockImplementation(async (input) => ({
      id: `file-${input.name}`,
      name: input.name,
      folderId: input.folderId,
      mime: input.mime,
      size: input.size,
      uploadedById: 'admin',
      uploadedByName: 'Admin',
      updatedAt: '2026-11-16T00:00:00.000Z',
      visibility: 'team',
      favorite: false,
    }))
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.body.innerHTML = ''
  })

  it('defaults the destination to the first folder', async () => {
    mountDialog()
    await flushPromises()

    expect(document.body.querySelector('[data-upload-folder]')?.textContent).toContain('Design')
    expect(document.body.textContent).toContain('No files queued yet.')
  })

  it('uploads a batch one file at a time and reports at the end', async () => {
    const dialog = mountDialog()
    await flushPromises()

    await drop([
      new File(['a'], 'notes.md', { type: 'text/markdown' }),
      new File(['b'], 'rows.csv', { type: 'text/csv' }),
      new File(['c'], 'payload.json', { type: 'application/json' }),
    ])
    await vi.waitFor(() => expect(rows('done')).toHaveLength(3))

    expect(uploadFile).toHaveBeenCalledTimes(3)
    // Serial, not parallel: the mock's read-modify-write loses concurrent writes.
    expect(vi.mocked(uploadFile).mock.calls.map(([input]) => input.name)).toEqual([
      'notes.md',
      'rows.csv',
      'payload.json',
    ])
    expect(document.body.textContent).toContain('3 uploaded')
    expect(dialog.emitted('uploaded')).toHaveLength(3)
  })

  it('refuses a file above the size limit without a request', async () => {
    mountDialog()
    await flushPromises()

    const big = new File(['x'], 'huge.pdf', { type: 'application/pdf' })
    Object.defineProperty(big, 'size', { value: 26 * 1024 * 1024, configurable: true })
    await drop([big])

    await vi.waitFor(() => expect(rows('error')).toHaveLength(1))
    expect(document.body.textContent).toContain('Files must be 25 MB or smaller.')
    expect(uploadFile).not.toHaveBeenCalled()
  })

  it('keeps a failed upload retryable', async () => {
    vi.mocked(uploadFile)
      .mockRejectedValueOnce(new Error('Server exploded'))
      .mockResolvedValueOnce({
        id: 'file-1',
        name: 'notes.md',
        folderId: 'folder-design',
        mime: 'text/markdown',
        size: 1,
        uploadedById: 'admin',
        uploadedByName: 'Admin',
        updatedAt: '2026-11-16T00:00:00.000Z',
        visibility: 'team',
        favorite: false,
      })
    mountDialog()
    await flushPromises()

    await drop([new File(['a'], 'notes.md', { type: 'text/markdown' })])
    await vi.waitFor(() => expect(rows('error')).toHaveLength(1))
    expect(document.body.textContent).toContain('Server exploded')

    const retry = document.body.querySelector<HTMLButtonElement>(
      '[data-upload-row="error"] button',
    )!
    retry.dispatchEvent(new Event('click', { bubbles: true }))
    await vi.waitFor(() => expect(rows('done')).toHaveLength(1))
    expect(uploadFile).toHaveBeenCalledTimes(2)
  })

  it('removes a queued row and forgets its file', async () => {
    vi.mocked(uploadFile).mockImplementation(() => new Promise(() => {}))
    mountDialog()
    await flushPromises()

    await drop([new File(['a'], 'notes.md', { type: 'text/markdown' })])
    await vi.waitFor(() => expect(rows('uploading')).toHaveLength(1))

    const remove = document.body.querySelector<HTMLButtonElement>(
      '[data-upload-row="uploading"] button[aria-label^="Remove"]',
    )!
    remove.dispatchEvent(new Event('click', { bubbles: true }))
    await flushPromises()

    expect(document.body.querySelectorAll('[data-upload-row]')).toHaveLength(0)
    expect(document.body.textContent).toContain('No files queued yet.')
  })
})
