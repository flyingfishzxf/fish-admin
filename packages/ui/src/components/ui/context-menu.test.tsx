import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from './context-menu'

function ContextMenuHarness({ onSelect }: { onSelect?: (action: string) => void }) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button type="button">Apollo migration</button>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={() => onSelect?.('Open')}>Open project</ContextMenuItem>
        <ContextMenuItem onSelect={() => onSelect?.('Copy')}>Copy link</ContextMenuItem>
        <ContextMenuItem onSelect={() => onSelect?.('Duplicate')}>Duplicate</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

describe('ContextMenu', () => {
  it('opens on the contextmenu event and runs the selected item', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<ContextMenuHarness onSelect={onSelect} />)
    const trigger = screen.getByRole('button', { name: 'Apollo migration' })

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    fireEvent.contextMenu(trigger, { clientX: 24, clientY: 32 })

    expect(await screen.findByRole('menu')).toBeVisible()

    await user.click(screen.getByRole('menuitem', { name: 'Copy link' }))

    expect(onSelect).toHaveBeenCalledWith('Copy')
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()
    render(<ContextMenuHarness />)
    const trigger = screen.getByRole('button', { name: 'Apollo migration' })

    fireEvent.contextMenu(trigger, { clientX: 24, clientY: 32 })
    await screen.findByRole('menu')

    await user.keyboard('{Escape}')

    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
  })
})
