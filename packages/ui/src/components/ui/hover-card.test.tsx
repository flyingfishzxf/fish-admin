import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { HoverCard, HoverCardContent, HoverCardTrigger } from './hover-card'

function HoverCardHarness() {
  return (
    <HoverCard openDelay={0} closeDelay={0}>
      <HoverCardTrigger asChild>
        <button type="button">@ada</button>
      </HoverCardTrigger>
      <HoverCardContent align="start">
        <span>Ada Lovelace</span>
        <span>@ada · Engineering</span>
      </HoverCardContent>
    </HoverCard>
  )
}

describe('HoverCard', () => {
  it('opens on hover and closes when the pointer leaves', async () => {
    const user = userEvent.setup()
    render(<HoverCardHarness />)
    const trigger = screen.getByRole('button', { name: '@ada' })

    expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument()

    await user.hover(trigger)

    expect(await screen.findByText('Ada Lovelace')).toBeVisible()
    expect(screen.getByText('@ada · Engineering')).toBeVisible()

    await user.unhover(trigger)

    await waitFor(() => expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument())
  })

  it('opens on focus and closes on blur', async () => {
    const user = userEvent.setup()
    render(<HoverCardHarness />)

    await user.tab()

    expect(screen.getByRole('button', { name: '@ada' })).toHaveFocus()
    expect(await screen.findByText('Ada Lovelace')).toBeVisible()

    await user.tab()

    await waitFor(() => expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument())
  })
})
