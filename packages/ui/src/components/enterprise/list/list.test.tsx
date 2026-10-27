import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Mail } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'

import { List, type ListItem } from './list'

const items: ListItem[] = [
  {
    id: 'welcome',
    title: 'Welcome email',
    description: 'Sent to new members',
    meta: '2m ago',
    icon: Mail,
  },
  {
    id: 'digest',
    title: 'Weekly digest',
    meta: '1h ago',
    actions: <button type="button">Open</button>,
  },
]

describe('List', () => {
  it('renders titles, descriptions and meta text', () => {
    render(<List items={items} ariaLabel="Messages" emptyLabel="Nothing here" />)

    expect(screen.getByRole('list', { name: 'Messages' })).toBeInTheDocument()
    expect(screen.getByText('Welcome email')).toBeInTheDocument()
    expect(screen.getByText('Sent to new members')).toBeInTheDocument()
    expect(screen.getByText('2m ago')).toBeInTheDocument()
  })

  it('selects clickable items without triggering row actions', async () => {
    const user = userEvent.setup()
    const onItemClick = vi.fn()
    render(
      <List
        items={items}
        ariaLabel="Messages"
        emptyLabel="Nothing here"
        selectedId="welcome"
        onItemClick={onItemClick}
      />,
    )

    expect(screen.getByRole('button', { name: /Welcome email/ })).toHaveAttribute(
      'aria-current',
      'true',
    )

    await user.click(screen.getByRole('button', { name: /Weekly digest/ }))
    expect(onItemClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'digest' }))

    await user.click(screen.getByRole('button', { name: 'Open' }))
    expect(onItemClick).toHaveBeenCalledTimes(1)
  })

  it('shows the empty label when there are no items', () => {
    render(<List items={[]} ariaLabel="Messages" emptyLabel="Nothing here" />)

    expect(screen.getByText('Nothing here')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })
})
