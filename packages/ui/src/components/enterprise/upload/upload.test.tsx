import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Upload, type UploadItem } from './upload'

const items: UploadItem[] = [
  { id: 'report', name: 'report.pdf', size: 1_400_000, status: 'done' },
  {
    id: 'assets',
    name: 'assets.zip',
    size: 8_200_000,
    status: 'error',
    error: 'Upload failed',
  },
]

function renderUpload(props: Partial<ComponentProps<typeof Upload>> = {}) {
  const { container } = render(
    <Upload
      items={items}
      label="Drop files here"
      browseLabel="Choose files"
      removeLabel={(item) => `Remove ${item.name}`}
      retryLabel="Retry upload"
      onFiles={vi.fn()}
      {...props}
    />,
  )

  return container
}

describe('Upload', () => {
  beforeEach(async () => {})

  it('passes selected files to the upload handler', () => {
    const onFiles = vi.fn()
    const container = renderUpload({ onFiles })
    const file = new File(['hello'], 'notes.txt', { type: 'text/plain' })
    const input = container.querySelector('input[type="file"]') as HTMLInputElement

    fireEvent.change(input, { target: { files: [file] } })

    expect(onFiles).toHaveBeenCalledWith([file])
  })

  it('rejects files above the size limit', () => {
    const onFiles = vi.fn()
    const container = renderUpload({
      onFiles,
      maxSize: 5,
      maxSizeLabel: 'File is too large',
    })
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['0123456789'], 'large.txt', { type: 'text/plain' })

    fireEvent.change(input, { target: { files: [file] } })

    expect(onFiles).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('File is too large')
  })

  it('offers remove and retry actions per file', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    const onRetry = vi.fn()
    renderUpload({ onRemove, onRetry })

    await user.click(screen.getByRole('button', { name: 'Retry upload' }))
    expect(onRetry).toHaveBeenCalledWith(expect.objectContaining({ id: 'assets' }))

    await user.click(screen.getByRole('button', { name: 'Remove report.pdf' }))
    expect(onRemove).toHaveBeenCalledWith(expect.objectContaining({ id: 'report' }))
  })
})
