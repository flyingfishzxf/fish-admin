import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog'

function AlertDialogHarness({
  onConfirm,
  onCancel,
}: {
  onConfirm?: () => void
  onCancel?: () => void
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button type="button">Revoke CI key</button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke the CI deploy key?</AlertDialogTitle>
          <AlertDialogDescription>
            Pipelines that authenticate with this key start failing on their next run.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Keep key</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Revoke key</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

describe('AlertDialog', () => {
  it('runs the confirm callback and closes', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<AlertDialogHarness onConfirm={onConfirm} />)

    await user.click(screen.getByRole('button', { name: 'Revoke CI key' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Revoke the CI deploy key?' })

    await user.click(screen.getByRole('button', { name: 'Revoke key' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(document.body).not.toContainElement(dialog)
  })

  it('runs the cancel callback and closes', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<AlertDialogHarness onCancel={onCancel} />)

    await user.click(screen.getByRole('button', { name: 'Revoke CI key' }))
    await screen.findByRole('alertdialog', { name: 'Revoke the CI deploy key?' })

    await user.click(screen.getByRole('button', { name: 'Keep key' }))

    expect(onCancel).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
  })

  it('stays open when the overlay is clicked', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<AlertDialogHarness onConfirm={onConfirm} />)

    await user.click(screen.getByRole('button', { name: 'Revoke CI key' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Revoke the CI deploy key?' })
    const overlay = document.querySelector<HTMLElement>('[data-slot="alert-dialog-overlay"]')

    expect(overlay).not.toBeNull()
    fireEvent.pointerDown(overlay as HTMLElement, { pointerType: 'mouse', button: 0, buttons: 1 })
    fireEvent.mouseDown(overlay as HTMLElement, { button: 0, buttons: 1 })
    fireEvent.click(overlay as HTMLElement)

    expect(screen.getByRole('alertdialog', { name: 'Revoke the CI deploy key?' })).toBe(dialog)
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
