import type { WorkspaceFile } from '@fish-admin/contracts'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { i18nReady, setLanguage } from '../../lib/i18n'
import FilePreviewPanel from './FilePreviewPanel.vue'

const folders = [
  { id: 'folder-design', name: 'Design', parentId: null, fileCount: 0 },
  { id: 'folder-brand', name: 'Brand', parentId: 'folder-design', fileCount: 0 },
]

function file(overrides: Partial<WorkspaceFile> = {}): WorkspaceFile {
  return {
    id: 'f1',
    name: 'brand-guidelines.md',
    folderId: 'folder-brand',
    mime: 'text/markdown',
    size: 2048,
    uploadedById: 'admin',
    uploadedByName: 'Ada Admin',
    updatedAt: '2026-11-01T10:00:00.000Z',
    visibility: 'team',
    favorite: false,
    ...overrides,
  }
}

const handlers = {
  onToggleFavorite: vi.fn(),
  onMove: vi.fn(async () => undefined),
  onRename: vi.fn(async () => true),
  onVisibilityChange: vi.fn(),
  onDelete: vi.fn(),
  onOpen: vi.fn(),
}

let wrapper: VueWrapper | null = null

// jsdom does not submit a form from a programmatic button click, so the form's
// own submit event is what the dialog listens to.
function submitRenameForm() {
  document.body
    .querySelector('form')!
    .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
}

function mountPanel(
  options: { file?: WorkspaceFile | null; canManage?: boolean; images?: WorkspaceFile[] } = {},
) {
  wrapper = mount(FilePreviewPanel, {
    props: {
      file: options.file === undefined ? file() : options.file,
      images: options.images ?? [],
      folders,
      language: 'en',
      canManage: options.canManage ?? true,
      ...handlers,
    },
    attachTo: document.body,
  })
  return wrapper
}

describe('FilePreviewPanel', () => {
  beforeEach(async () => {
    await i18nReady
    await setLanguage('en')
    document.body.innerHTML = ''
    vi.clearAllMocks()
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.body.innerHTML = ''
  })

  it('asks for a selection when nothing is chosen', () => {
    const panel = mountPanel({ file: null })
    expect(panel.find('[data-preview-empty]').exists()).toBe(true)
    expect(panel.text()).toContain('Nothing selected')
  })

  it('shows the file header and the metadata field names', () => {
    const panel = mountPanel()
    expect(panel.get('[data-preview-name]').text()).toBe('brand-guidelines.md')
    const terms = panel.findAll('[data-preview-meta] dt').map((term) => term.text())
    expect(terms).toEqual([
      'id',
      'name',
      'mime',
      'size',
      'folder',
      'visibility',
      'favorite',
      'uploadedBy',
      'updatedAt',
      'preview',
    ])
    expect(panel.get('[data-preview-meta]').text()).toContain('Design / Brand')
    expect(panel.get('[data-preview-meta]').text()).toContain('2 KB')
  })

  it('renames through the dialog and closes when the save resolves', async () => {
    const panel = mountPanel()
    await panel.get('[data-preview-rename]').trigger('click')
    await flushPromises()

    const input = document.body.querySelector<HTMLInputElement>('#file-rename')!
    input.value = 'brand-guide.md'
    input.dispatchEvent(new Event('input'))
    await flushPromises()

    submitRenameForm()
    await flushPromises()

    expect(handlers.onRename).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'f1' }),
      'brand-guide.md',
    )
    await vi.waitFor(() => expect(document.querySelector('[data-rename-dialog]')).toBeNull())
  })

  it('keeps the dialog open when the rename is refused', async () => {
    handlers.onRename.mockResolvedValueOnce(false)
    const panel = mountPanel()
    await panel.get('[data-preview-rename]').trigger('click')
    await flushPromises()

    const input = document.body.querySelector<HTMLInputElement>('#file-rename')!
    input.value = 'taken.md'
    input.dispatchEvent(new Event('input'))
    await flushPromises()
    submitRenameForm()
    await flushPromises()

    expect(document.querySelector('[data-rename-dialog]')).not.toBeNull()
  })

  it('flips visibility from the switch', async () => {
    const panel = mountPanel()
    const toggle = panel.get('[data-visibility-switch]')
    await toggle.trigger('click')
    expect(handlers.onVisibilityChange).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'f1' }),
      'private',
    )
  })

  it('confirms a delete in the dialog', async () => {
    const panel = mountPanel()
    await panel.get('[data-preview-delete]').trigger('click')
    await flushPromises()

    const dialog = document.body.querySelector('[role="alertdialog"]')!
    const confirm = Array.from(dialog.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Delete',
    )!
    confirm.dispatchEvent(new Event('click', { bubbles: true }))
    await flushPromises()

    expect(handlers.onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 'f1' }))
  })

  it('lists the folder images and selects one', async () => {
    const images = [
      file({
        id: 'f1',
        name: 'one.svg',
        mime: 'image/svg+xml',
        dataUrl: 'data:image/svg+xml;base64,a',
      }),
      file({
        id: 'f2',
        name: 'two.svg',
        mime: 'image/svg+xml',
        dataUrl: 'data:image/svg+xml;base64,b',
      }),
    ]
    const panel = mountPanel({ images, file: images[0]! })
    const gallery = panel.get('[data-preview-gallery]')
    expect(gallery.findAll('button')).toHaveLength(2)

    await gallery.findAll('button')[1]!.trigger('click')
    expect(handlers.onOpen).toHaveBeenCalledWith(images[1])
  })

  it('hides every write control from a read-only role', () => {
    const panel = mountPanel({ canManage: false })
    expect(panel.find('[data-preview-rename]').exists()).toBe(false)
    expect(panel.find('[data-preview-manage]').exists()).toBe(false)
    expect(panel.find('[data-preview-delete]').exists()).toBe(false)
  })
})
