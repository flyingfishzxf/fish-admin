import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible'

function CollapsibleHarness({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  return (
    <Collapsible defaultOpen={false} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <button type="button">Advanced retention settings</button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <p>Control how long exports and audit events are kept.</p>
      </CollapsibleContent>
    </Collapsible>
  )
}

describe('Collapsible', () => {
  it('reflects the open state on the trigger and mounts the content', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<CollapsibleHarness onOpenChange={onOpenChange} />)
    const trigger = screen.getByRole('button', { name: 'Advanced retention settings' })

    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(
      screen.queryByText('Control how long exports and audit events are kept.'),
    ).not.toBeInTheDocument()

    await user.click(trigger)

    expect(onOpenChange).toHaveBeenLastCalledWith(true)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.getByText('Control how long exports and audit events are kept.'),
    ).toBeInTheDocument()

    await user.click(trigger)

    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(
      screen.queryByText('Control how long exports and audit events are kept.'),
    ).not.toBeInTheDocument()
  })

  it('starts expanded when defaultOpen is set', () => {
    render(
      <Collapsible defaultOpen>
        <CollapsibleTrigger asChild>
          <button type="button">Export details</button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <p>workspace-members-2026-10.csv</p>
        </CollapsibleContent>
      </Collapsible>,
    )

    expect(screen.getByRole('button', { name: 'Export details' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(screen.getByText('workspace-members-2026-10.csv')).toBeVisible()
  })
})
