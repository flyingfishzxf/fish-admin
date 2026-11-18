import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import Upload from './Upload.vue'
import type { UploadItem } from './Upload.vue'

const items: UploadItem[] = [
  { id: 'a', name: 'design.pdf', size: 1024, status: 'uploading', progress: 60 },
  { id: 'b', name: 'broken.png', size: 10, status: 'error', error: 'Upload failed' },
  { id: 'c', name: 'done.txt', size: 5, status: 'done', progress: 100 },
]

describe('Upload', () => {
  it('renders the dropzone and each row state', () => {
    const wrapper = mount(Upload, {
      props: { items, onFiles: () => {}, label: 'Drop files', hint: 'PDF or PNG up to 5 MB' },
    })

    expect(wrapper.text()).toContain('Drop files')
    expect(wrapper.text()).toContain('design.pdf')
    expect(wrapper.text()).toContain('60%')
    expect(wrapper.text()).toContain('Upload failed')
  })

  it('blocks oversized picks with an alert', async () => {
    let accepted: File[] = []
    const wrapper = mount(Upload, {
      props: {
        items: [],
        onFiles: (files: File[]) => (accepted = files),
        label: 'Drop files',
        maxSize: 100,
      },
    })

    const big = new File(['x'.repeat(200)], 'big.pdf', { type: 'application/pdf' })
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [big] })
    await input.trigger('change')

    expect(accepted).toHaveLength(0)
    expect(wrapper.find('[role="alert"]').text()).toContain('Files must be 100 B or smaller.')
  })

  it('renders remove and retry actions with accessible names', () => {
    const onRemove = vi.fn((item: UploadItem) => item.id)
    const onRetry = vi.fn((item: UploadItem) => item.id)
    const wrapper = mount(Upload, {
      props: {
        items,
        onFiles: () => {},
        label: 'Drop files',
        onRemove,
        onRetry,
        removeLabel: (item: UploadItem) => `Remove ${item.name}`,
      },
    })

    expect(wrapper.find('[aria-label="Remove broken.png"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Try again"]').exists()).toBe(true)
    expect(onRemove).not.toHaveBeenCalled()
    expect(onRetry).not.toHaveBeenCalled()
  })
})
