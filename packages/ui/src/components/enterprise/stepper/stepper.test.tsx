import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Stepper, type StepperStep } from './stepper'

const STEPS: StepperStep[] = [
  { id: 'workspace', title: 'Workspace', description: 'Name the workspace.' },
  { id: 'billing', title: 'Billing', description: 'Choose a plan.' },
  { id: 'members', title: 'Members', description: 'Invite teammates.' },
]

describe('Stepper', () => {
  it('marks the current step and styles complete, current and upcoming steps differently', () => {
    render(<Stepper steps={STEPS} current={1} ariaLabel="Workspace setup steps" />)

    const list = screen.getByRole('list', { name: 'Workspace setup steps' })
    const [complete, current, upcoming] = within(list).getAllByRole('listitem')

    expect(within(list).getAllByRole('listitem')).toHaveLength(STEPS.length)
    expect(complete).not.toHaveAttribute('aria-current')
    expect(current).toHaveAttribute('aria-current', 'step')
    expect(upcoming).not.toHaveAttribute('aria-current')

    // Without onStepClick every step is inert, so the marker always sits inside a div.
    expect(complete!.querySelector('div > span')).toHaveClass(
      'bg-primary',
      'text-primary-foreground',
    )
    expect(current!.querySelector('div > span')).toHaveClass('border-primary', 'text-primary')
    expect(upcoming!.querySelector('div > span')).toHaveClass(
      'border-border',
      'text-muted-foreground',
    )
  })

  it('switches through the steps that are reachable when onStepClick is provided', async () => {
    const user = userEvent.setup()
    const onStepClick = vi.fn()

    render(
      <Stepper
        steps={STEPS}
        current={1}
        onStepClick={onStepClick}
        ariaLabel="Workspace setup steps"
      />,
    )

    const list = screen.getByRole('list', { name: 'Workspace setup steps' })
    const [complete, current, upcoming] = within(list).getAllByRole('listitem')

    await user.click(within(complete!).getByRole('button'))
    expect(onStepClick).toHaveBeenLastCalledWith(0)

    await user.click(within(current!).getByRole('button'))
    expect(onStepClick).toHaveBeenLastCalledWith(1)

    await user.click(within(upcoming!).getByText('Members'))
    expect(onStepClick).toHaveBeenCalledTimes(2)
    expect(within(upcoming!).queryByRole('button')).not.toBeInTheDocument()
  })
})
