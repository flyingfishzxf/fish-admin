import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from './popover'

function PopoverHarness() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button">Filter notifications</button>
      </PopoverTrigger>
      <PopoverContent aria-label="Notification filters">
        <PopoverHeader>
          <PopoverTitle>Notification filters</PopoverTitle>
          <PopoverDescription>Choose which alerts reach your inbox.</PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  )
}

describe('Popover', () => {
  it('opens on trigger click and portals the content to the body', async () => {
    const user = userEvent.setup()
    const { container } = render(<PopoverHarness />)
    const trigger = screen.getByRole('button', { name: 'Filter notifications' })

    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Choose which alerts reach your inbox.')).not.toBeInTheDocument()

    await user.click(trigger)

    const description = await screen.findByText('Choose which alerts reach your inbox.')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(document.body).toContainElement(description)
    expect(container).not.toContainElement(description)
  })

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup()
    render(<PopoverHarness />)
    const trigger = screen.getByRole('button', { name: 'Filter notifications' })

    await user.click(trigger)
    await screen.findByText('Choose which alerts reach your inbox.')

    await user.keyboard('{Escape}')

    await waitFor(() =>
      expect(screen.queryByText('Choose which alerts reach your inbox.')).not.toBeInTheDocument(),
    )
    await waitFor(() => expect(trigger).toHaveFocus())
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })
})
