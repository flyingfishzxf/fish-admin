import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog'

function DialogHarness() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button">Invite member</button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a member</DialogTitle>
          <DialogDescription>
            They receive an email with a link to join the Acme Operations workspace.
          </DialogDescription>
        </DialogHeader>
        <label htmlFor="dialog-email">Email address</label>
        <input id="dialog-email" type="email" />
        <DialogFooter>
          <DialogClose asChild>
            <button type="button">Cancel</button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

describe('Dialog', () => {
  it('portals the content to the body and moves focus inside', async () => {
    const user = userEvent.setup()
    const { container } = render(<DialogHarness />)
    const trigger = screen.getByRole('button', { name: 'Invite member' })

    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(trigger)

    const dialog = await screen.findByRole('dialog', { name: 'Invite a member' })

    expect(document.body).toContainElement(dialog)
    expect(container).not.toContainElement(dialog)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.getByText('They receive an email with a link to join the Acme Operations workspace.'),
    ).toBeVisible()
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Email address' })).toHaveFocus(),
    )
  })

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup()
    render(<DialogHarness />)
    const trigger = screen.getByRole('button', { name: 'Invite member' })

    await user.click(trigger)
    await screen.findByRole('dialog', { name: 'Invite a member' })

    await user.keyboard('{Escape}')

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Invite a member' })).not.toBeInTheDocument(),
    )
    await waitFor(() => expect(trigger).toHaveFocus())
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes through the footer close action', async () => {
    const user = userEvent.setup()
    render(<DialogHarness />)

    await user.click(screen.getByRole('button', { name: 'Invite member' }))
    await screen.findByRole('dialog', { name: 'Invite a member' })

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})
