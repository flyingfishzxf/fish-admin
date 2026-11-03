import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Dropzone } from './dropzone'

const CSV_FILE = new File(['name,email'], 'members.csv', { type: 'text/csv' })

describe('Dropzone', () => {
  it('passes picked files to onFiles and forwards accept and multiple to the input', async () => {
    const user = userEvent.setup()
    const onFiles = vi.fn()

    render(
      <Dropzone
        onFiles={onFiles}
        multiple
        accept=".csv"
        label="Import members"
        browseLabel="Choose files"
      />,
    )

    const input = screen.getByLabelText('Import members')
    const secondFile = new File(['name,email'], 'invites.csv', { type: 'text/csv' })

    expect(input).toHaveAttribute('type', 'file')
    expect(input).toHaveAttribute('accept', '.csv')
    expect(input).toHaveAttribute('multiple')

    await user.upload(input, [CSV_FILE, secondFile])

    expect(onFiles).toHaveBeenCalledTimes(1)
    expect(onFiles).toHaveBeenCalledWith([CSV_FILE, secondFile])
  })

  it('falls back to onFile with the first picked file', async () => {
    const user = userEvent.setup()
    const onFile = vi.fn()

    render(<Dropzone onFile={onFile} label="Drop a file" />)

    await user.upload(screen.getByLabelText('Drop a file'), CSV_FILE)

    expect(onFile).toHaveBeenCalledTimes(1)
    expect(onFile).toHaveBeenCalledWith(CSV_FILE)
  })

  it('blocks picking and dropping while disabled', async () => {
    const user = userEvent.setup()
    const onFiles = vi.fn()
    const { container } = render(
      <Dropzone onFiles={onFiles} label="Import members" disabled browseLabel="Choose files" />,
    )

    const input = screen.getByLabelText('Import members')
    const dropArea = container.firstElementChild as HTMLElement

    expect(input).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Choose files' })).toBeDisabled()
    expect(dropArea).toHaveAttribute('aria-disabled', 'true')

    await user.upload(input, CSV_FILE)
    fireEvent.drop(dropArea, { dataTransfer: { files: [CSV_FILE] } })

    expect(onFiles).not.toHaveBeenCalled()
  })

  it('forwards accept to the native picker while drops bypass it (documented contract)', () => {
    const onFiles = vi.fn()
    const { container } = render(
      <Dropzone onFiles={onFiles} accept=".csv" label="Import members" />,
    )
    const dropArea = container.firstElementChild as HTMLElement
    const textFile = new File(['notes'], 'notes.txt', { type: 'text/plain' })

    expect(screen.getByLabelText('Import members')).toHaveAttribute('accept', '.csv')

    fireEvent.drop(dropArea, { dataTransfer: { files: [textFile] } })

    expect(onFiles).toHaveBeenCalledWith([textFile])
  })
})
