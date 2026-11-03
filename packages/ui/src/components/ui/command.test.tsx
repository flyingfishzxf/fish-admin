import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from './command'

function CommandHarness({ onSelect }: { onSelect?: (command: string) => void }) {
  return (
    <Command>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No commands match that search.</CommandEmpty>
        <CommandGroup heading="Workspace">
          <CommandItem onSelect={() => onSelect?.('Invite teammate')}>Invite teammate</CommandItem>
          <CommandItem onSelect={() => onSelect?.('Export members to CSV')}>
            Export members to CSV
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Account">
          <CommandItem onSelect={() => onSelect?.('Manage API keys')}>Manage API keys</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

describe('Command', () => {
  it('filters items as the query is typed', async () => {
    const user = userEvent.setup()
    render(<CommandHarness />)
    const input = screen.getByPlaceholderText('Type a command or search…')

    expect(screen.getByText('Invite teammate')).toBeVisible()

    await user.type(input, 'export')

    expect(screen.getByText('Export members to CSV')).toBeVisible()
    expect(screen.queryByText('Invite teammate')).not.toBeInTheDocument()
    expect(screen.queryByText('Manage API keys')).not.toBeInTheDocument()
    expect(screen.getByText('Workspace')).toBeVisible()
  })

  it('runs the active item when Enter is pressed', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<CommandHarness onSelect={onSelect} />)
    const input = screen.getByPlaceholderText('Type a command or search…')

    await user.type(input, 'invite')
    await user.keyboard('{Enter}')

    expect(onSelect).toHaveBeenCalledWith('Invite teammate')
  })

  it('shows the empty state for an unmatched query', async () => {
    const user = userEvent.setup()
    render(<CommandHarness />)
    const input = screen.getByPlaceholderText('Type a command or search…')

    await user.type(input, 'zzzz')

    expect(screen.getByText('No commands match that search.')).toBeVisible()
    expect(screen.queryByText('Invite teammate')).not.toBeInTheDocument()
    expect(screen.queryByText('Manage API keys')).not.toBeInTheDocument()
  })
})
