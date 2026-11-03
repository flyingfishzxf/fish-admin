import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Timeline, type TimelineItem } from './timeline'

const ITEMS: TimelineItem[] = [
  {
    id: 'role',
    title: 'Role changed to Admin',
    description: 'Ada promoted Katherine in the Platform team.',
    timestamp: '2 hours ago',
    tone: 'info',
  },
  {
    id: 'invite',
    title: 'Invitation accepted',
    timestamp: 'Yesterday',
    tone: 'success',
  },
  {
    id: 'login',
    title: 'New sign-in from Berlin',
    description: 'Chrome on macOS, IP 203.0.113.24.',
    timestamp: '5 days ago',
  },
]

function toneMarker(item: HTMLElement) {
  const marker = Array.from(item.children).find(
    (child) => child.tagName === 'SPAN' && !child.hasAttribute('aria-hidden'),
  )
  if (!marker) throw new Error('Timeline item has no tone marker')
  return marker
}

describe('Timeline', () => {
  it('renders every entry with its copy, timestamp and tone', () => {
    render(<Timeline items={ITEMS} />)

    const entries = screen.getAllByRole('listitem')

    expect(entries).toHaveLength(ITEMS.length)

    expect(within(entries[0]!).getByText('Role changed to Admin')).toBeVisible()
    expect(entries[0]).toHaveTextContent('Ada promoted Katherine in the Platform team.')
    expect(entries[0]).toHaveTextContent('2 hours ago')
    expect(within(entries[1]!).getByText('Invitation accepted')).toBeVisible()
    expect(within(entries[2]!).getByText('New sign-in from Berlin')).toBeVisible()
    expect(entries[2]).toHaveTextContent('5 days ago')

    expect(toneMarker(entries[0]!)).toHaveClass('bg-chart-1/12', 'text-chart-1-foreground')
    expect(toneMarker(entries[1]!)).toHaveClass('bg-chart-3/14', 'text-chart-3-foreground')
    expect(toneMarker(entries[2]!)).toHaveClass('bg-muted', 'text-muted-foreground')
  })

  it('shows the empty label, or nothing at all when the list is empty', () => {
    const { container, rerender } = render(<Timeline items={[]} emptyLabel="No activity yet" />)

    expect(screen.getByText('No activity yet')).toBeVisible()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()

    rerender(<Timeline items={[]} />)

    expect(container).toBeEmptyDOMElement()
  })
})
