import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { Popconfirm } from './popconfirm'
import { Button } from '../../ui/button'

function Harness({ pending = false, onConfirm }: { pending?: boolean; onConfirm: () => void }) {
  return (
    <Popconfirm
      title="Delete user?"
      description="This action cannot be undone."
      onConfirm={onConfirm}
      pending={pending}
      destructive
    >
      <Button type="button">Delete user</Button>
    </Popconfirm>
  )
}

async function openPopconfirm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Delete user' }))
  return screen.findByRole('alertdialog')
}

describe('Popconfirm', () => {
  beforeAll(async () => {})

  it('opens as an alert dialog with its title and description', async () => {
    const user = userEvent.setup()
    render(<Harness onConfirm={vi.fn()} />)

    const dialog = await openPopconfirm(user)

    expect(dialog).toHaveTextContent('Delete user?')
    expect(dialog).toHaveTextContent('This action cannot be undone.')
    expect(dialog).toHaveAccessibleName('Delete user?')
    expect(dialog).toHaveAccessibleDescription('This action cannot be undone.')
  })

  it('closes on cancel without confirming', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<Harness onConfirm={onConfirm} />)

    await openPopconfirm(user)
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(onConfirm).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Delete user' })).toHaveFocus()
  })

  it('calls onConfirm and closes when not pending', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<Harness onConfirm={onConfirm} />)

    await openPopconfirm(user)
    await user.click(screen.getByRole('button', { name: 'Confirm' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
  })

  it('stays open and disables confirm while pending', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<Harness pending onConfirm={onConfirm} />)

    await openPopconfirm(user)

    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled()
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup()
    render(<Harness onConfirm={vi.fn()} />)

    await openPopconfirm(user)
    await user.keyboard('{Escape}')

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Delete user' })).toHaveFocus()
  })
})
