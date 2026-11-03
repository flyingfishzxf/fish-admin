import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'

function TooltipHarness() {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button">Copy invite link</button>
        </TooltipTrigger>
        <TooltipContent>Copy the invite link to your clipboard</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

describe('Tooltip', () => {
  it('shows on hover', async () => {
    const user = userEvent.setup()
    render(<TooltipHarness />)
    const trigger = screen.getByRole('button', { name: 'Copy invite link' })

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    await user.hover(trigger)

    const tooltip = await screen.findByRole('tooltip')
    expect(tooltip).toHaveTextContent('Copy the invite link to your clipboard')
  })

  it('shows on focus and hides on blur', async () => {
    const user = userEvent.setup()
    render(<TooltipHarness />)

    await user.tab()

    expect(screen.getByRole('button', { name: 'Copy invite link' })).toHaveFocus()
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Copy the invite link to your clipboard',
    )

    await user.tab()

    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument())
  })

  it('hides on Escape', async () => {
    const user = userEvent.setup()
    render(<TooltipHarness />)
    const trigger = screen.getByRole('button', { name: 'Copy invite link' })

    await user.hover(trigger)
    await screen.findByRole('tooltip')

    await user.keyboard('{Escape}')

    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument())
  })
})
