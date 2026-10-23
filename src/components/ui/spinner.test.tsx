import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { LoadingOverlay, Spinner } from '@/components/ui/spinner'

describe('Spinner', () => {
  it('exposes a status role with its label', () => {
    render(<Spinner label="Loading data" />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading data')
  })

  it('is hidden from assistive technology without a label', () => {
    const { container } = render(<Spinner />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(container.querySelector('[data-slot="spinner"]')).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('LoadingOverlay', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows and hides the overlay immediately with delay=0', () => {
    const { rerender } = render(
      <LoadingOverlay loading label="Saving" delay={0}>
        <p>Content</p>
      </LoadingOverlay>,
    )
    const wrapper = screen.getByText('Content').closest('[data-slot="loading-overlay"]')

    expect(wrapper).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('status')).toHaveTextContent('Saving')

    rerender(
      <LoadingOverlay loading={false} label="Saving" delay={0}>
        <p>Content</p>
      </LoadingOverlay>,
    )

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(wrapper).toHaveAttribute('aria-busy', 'false')
  })

  it('waits for the delay before showing the overlay', () => {
    vi.useFakeTimers()

    render(
      <LoadingOverlay loading label="Loading" delay={150}>
        <p>Content</p>
      </LoadingOverlay>,
    )

    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(149)
    })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(screen.getByRole('status')).toHaveTextContent('Loading')
  })
})
