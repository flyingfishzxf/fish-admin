import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Tour, type TourLabels, type TourStep } from '@/components/enterprise/tour/tour'

const labels: TourLabels = {
  next: 'Next',
  previous: 'Back',
  skip: 'Skip tour',
  finish: 'Finish',
  step: (current, total) => `${current} of ${total}`,
}

function Harness({
  onOpenChange = vi.fn(),
  onFinish = vi.fn(),
}: {
  onOpenChange?: (open: boolean) => void
  onFinish?: () => void
}) {
  const first = useRef<HTMLButtonElement>(null)
  const second = useRef<HTMLInputElement>(null)
  const steps: TourStep[] = [
    { target: () => first.current, title: 'Create a record', description: 'Start here.' },
    { target: () => second.current, title: 'Name it', description: 'Then name it.' },
  ]

  return (
    <div>
      <button ref={first} type="button">
        Create
      </button>
      <input ref={second} aria-label="Name" />
      <Tour steps={steps} open onOpenChange={onOpenChange} onFinish={onFinish} labels={labels} />
    </div>
  )
}

describe('Tour', () => {
  it('walks through the steps and finishes on the last one', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const onFinish = vi.fn()
    render(<Harness onOpenChange={onOpenChange} onFinish={onFinish} />)

    expect(screen.getByRole('dialog', { name: 'Create a record' })).toBeInTheDocument()
    expect(screen.getByText('1 of 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('dialog', { name: 'Name it' })).toBeInTheDocument()
    expect(screen.getByText('2 of 2')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('dialog', { name: 'Create a record' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Finish' }))
    expect(onFinish).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('closes with Escape or the skip control', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<Harness onOpenChange={onOpenChange} />)

    await user.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenCalledWith(false)

    await user.click(screen.getByRole('button', { name: 'Skip tour' }))
    expect(onOpenChange).toHaveBeenCalledTimes(2)
  })
})
