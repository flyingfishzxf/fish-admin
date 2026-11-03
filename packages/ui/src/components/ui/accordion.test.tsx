import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion'

function AccordionHarness({
  type = 'single',
  onValueChange,
}: {
  type?: 'single' | 'multiple'
  onValueChange?: (value: string | string[]) => void
}) {
  return (
    <Accordion
      type={type}
      collapsible
      onValueChange={(value: string | string[]) => onValueChange?.(value)}
    >
      <AccordionItem value="billing">
        <AccordionTrigger>How does per-seat billing work?</AccordionTrigger>
        <AccordionContent>Billed for active members at the end of each cycle.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="security">
        <AccordionTrigger>Where is workspace data stored?</AccordionTrigger>
        <AccordionContent>Data stays in the region selected at creation time.</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

describe('Accordion', () => {
  it('expands and collapses a panel on click', async () => {
    const user = userEvent.setup()
    render(<AccordionHarness />)
    const trigger = screen.getByRole('button', { name: 'How does per-seat billing work?' })

    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(
      screen.queryByText('Billed for active members at the end of each cycle.'),
    ).not.toBeInTheDocument()

    await user.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.getByText('Billed for active members at the end of each cycle.'),
    ).toBeInTheDocument()

    await user.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(
      screen.queryByText('Billed for active members at the end of each cycle.'),
    ).not.toBeInTheDocument()
  })

  it('toggles with Enter and Space from the keyboard', async () => {
    const user = userEvent.setup()
    render(<AccordionHarness />)
    const trigger = screen.getByRole('button', { name: 'Where is workspace data stored?' })

    trigger.focus()
    await user.keyboard('{Enter}')

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Data stays in the region selected at creation time.')).toBeVisible()

    await user.keyboard(' ')

    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(
      screen.queryByText('Data stays in the region selected at creation time.'),
    ).not.toBeInTheDocument()
  })

  it('keeps only one panel open in single mode and reports the value', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<AccordionHarness onValueChange={onValueChange} />)
    const billing = screen.getByRole('button', { name: 'How does per-seat billing work?' })
    const security = screen.getByRole('button', { name: 'Where is workspace data stored?' })

    await user.click(billing)
    expect(onValueChange).toHaveBeenLastCalledWith('billing')

    await user.click(security)

    expect(onValueChange).toHaveBeenLastCalledWith('security')
    expect(billing).toHaveAttribute('aria-expanded', 'false')
    expect(security).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.queryByText('Billed for active members at the end of each cycle.'),
    ).not.toBeInTheDocument()
    expect(screen.getByText('Data stays in the region selected at creation time.')).toBeVisible()

    await user.click(security)

    expect(onValueChange).toHaveBeenLastCalledWith('')
    expect(security).toHaveAttribute('aria-expanded', 'false')
  })
})
