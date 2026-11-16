import type { WorkspaceFile } from '@fish-admin/contracts'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { i18nReady, setLanguage } from '../../lib/i18n'
import { useAuthStore } from '../../stores/auth'
import { deleteFiles, fetchFileFolders, fetchFiles, updateFile } from './api'
import FilesPage from './FilesPage.vue'

vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>()
  return {
    ...actual,
    fetchFileFolders: vi.fn(),
    fetchFiles: vi.fn(),
    updateFile: vi.fn(),
    deleteFile: vi.fn(),
    deleteFiles: vi.fn(),
  }
})

// Uploads are exercised through their own component; the page only needs the
// dialog to mount.
vi.mock('./FileUploadDialog.vue', () => ({
  default: { name: 'FileUploadDialog', props: ['open'], template: '<div data-upload-stub />' },
}))

const folders = [
  { id: 'folder-design', name: 'Design', parentId: null, fileCount: 2 },
  { id: 'folder-design-brand', name: 'Brand', parentId: 'folder-design', fileCount: 1 },
]

function file(id: string, name: string, extra: Partial<WorkspaceFile> = {}): WorkspaceFile {
  return {
    id,
    name,
    folderId: 'folder-design-brand',
    mime: 'text/markdown',
    size: 2048,
    uploadedById: 'admin',
    uploadedByName: 'Admin',
    updatedAt: '2026-11-01T10:00:00.000Z',
    visibility: 'team',
    favorite: false,
    ...extra,
  }
}

const files = [
  file('f1', 'brand-guidelines.md'),
  file('f2', 'rows.csv', { mime: 'text/csv', size: 4096, favorite: true }),
  file('f3', 'shot.svg', { mime: 'image/svg+xml', dataUrl: 'data:image/svg+xml;base64,x' }),
]

function pageOf(items: WorkspaceFile[], total = items.length, pageCount = 1) {
  return { items, total, page: 1, pageSize: 12, pageCount }
}

let wrapper: VueWrapper | null = null

function mountPage(permissions = ['file:read', 'file:manage']) {
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

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  wrapper = mount(FilesPage, {
    attachTo: document.body,
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient }]] },
  })
  return wrapper
}

async function waitForGrid(page: VueWrapper) {
  await vi.waitFor(() => expect(page.text()).toContain(files[0]!.name))
}

async function click(selector: string) {
  document.body
    .querySelector<HTMLElement>(selector)!
    .dispatchEvent(new Event('click', { bubbles: true }))
  await flushPromises()
}

describe('FilesPage', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    document.body.innerHTML = ''
    vi.clearAllMocks()
    vi.mocked(fetchFileFolders).mockResolvedValue({ folders, total: 3, favorites: 1 })
    vi.mocked(fetchFiles).mockResolvedValue(pageOf(files, 3))
    vi.mocked(updateFile).mockImplementation(async () => files[0] as never)
    vi.mocked(deleteFiles).mockResolvedValue({ deleted: 2 })
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.body.innerHTML = ''
  })

  it('renders the grid with a folder tree and a summary', async () => {
    const page = mountPage()
    await waitForGrid(page)

    expect(page.findAll('[data-file-id]')).toHaveLength(3)
    expect(page.get('[data-folder-all]').text()).toContain('3')
    expect(page.get('[data-files-summary]').text()).toContain('1–3 of 3')
    expect(fetchFiles).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, pageSize: 12, kind: 'all', favorite: false }),
      expect.anything(),
    )
  })

  it('reports an empty folder without pretending it is an error', async () => {
    vi.mocked(fetchFiles).mockResolvedValue(pageOf([], 0))
    const page = mountPage()

    await vi.waitFor(() => expect(page.text()).toContain('No files here'))
    expect(page.find('[data-empty-upload]').exists()).toBe(true)
  })

  it('offers a retry when the list fails', async () => {
    vi.mocked(fetchFiles).mockRejectedValue(new Error('offline'))
    const page = mountPage()

    await vi.waitFor(() => expect(page.text()).toContain('Something went wrong'))
    expect(page.text()).toContain('Try again')
  })

  it('refetches with the folder scope when a tree row is clicked', async () => {
    const page = mountPage()
    await waitForGrid(page)

    await page.get('[data-folder-id="folder-design-brand"]').trigger('click')
    await vi.waitFor(() =>
      expect(fetchFiles).toHaveBeenLastCalledWith(
        expect.objectContaining({ folderId: 'folder-design-brand', page: 1 }),
        expect.anything(),
      ),
    )
    expect(page.get('[data-breadcrumb-current]').text()).toBe('Brand')
  })

  it('switches to the list view without a new request', async () => {
    const page = mountPage()
    await waitForGrid(page)
    const calls = vi.mocked(fetchFiles).mock.calls.length

    await page.findAll('[data-view-switch] button')[1]!.trigger('click')
    await flushPromises()

    expect(page.find('[data-file-table]').exists()).toBe(true)
    expect(page.find('[data-file-grid]').exists()).toBe(false)
    expect(vi.mocked(fetchFiles).mock.calls.length).toBe(calls)
  })

  it('toggles a favorite through the update endpoint', async () => {
    const page = mountPage()
    await waitForGrid(page)

    await page.get('[data-favorite="f1"]').trigger('click')
    await vi.waitFor(() => expect(updateFile).toHaveBeenCalledWith('f1', { favorite: true }))
  })

  it('bulk deletes the selection and clears it', async () => {
    const page = mountPage()
    await waitForGrid(page)

    await page.get('[data-file-id="f1"] [data-slot="checkbox"]').trigger('click')
    await page.get('[data-file-id="f2"] [data-slot="checkbox"]').trigger('click')
    await flushPromises()
    expect(page.get('[data-files-selection]').text()).toContain('2 selected')

    await click('[data-bulk-delete]')
    await vi.waitFor(() => expect(document.body.textContent).toContain('Delete selected files?'))
    // Scope to the dialog: the trigger button also says "Delete selected (2)".
    const dialog = document.body.querySelector('[role="alertdialog"]')!
    const confirm = Array.from(dialog.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Delete',
    )!
    confirm.dispatchEvent(new Event('click', { bubbles: true }))
    await flushPromises()

    // TanStack passes the mutation context as the second argument.
    expect(deleteFiles).toHaveBeenCalledWith(['f1', 'f2'], expect.anything())
    await vi.waitFor(() =>
      expect(page.get('[data-files-notice]').text()).toContain('Deleted 2 files.'),
    )
    expect(page.find('[data-files-selection]').exists()).toBe(false)
  })

  it('clears the selection when a filter changes', async () => {
    const page = mountPage()
    await waitForGrid(page)

    await page.get('[data-file-id="f1"] [data-slot="checkbox"]').trigger('click')
    await flushPromises()
    expect(page.find('[data-files-selection]').exists()).toBe(true)

    await page.get('[data-filters-favorite]').trigger('click')
    await flushPromises()
    expect(page.find('[data-files-selection]').exists()).toBe(false)
    expect(fetchFiles).toHaveBeenLastCalledWith(
      expect.objectContaining({ favorite: true, page: 1 }),
      expect.anything(),
    )
  })

  it('gives a read-only role no write affordance', async () => {
    const page = mountPage(['file:read'])
    await waitForGrid(page)

    expect(page.find('[data-upload-open]').exists()).toBe(false)
    expect(page.find('[data-favorite]').exists()).toBe(false)
    expect(page.find('[data-delete]').exists()).toBe(false)
  })
})
