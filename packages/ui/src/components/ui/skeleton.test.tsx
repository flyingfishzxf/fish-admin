import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Skeleton } from './skeleton'

describe('Skeleton', () => {
  it('renders a hidden placeholder with the default pulse styling', () => {
    render(<Skeleton data-testid="skeleton" className="h-4 w-32" />)

    const skeleton = screen.getByTestId('skeleton')

    expect(skeleton).toHaveAttribute('data-slot', 'skeleton')
    expect(skeleton).toHaveAttribute('aria-hidden', 'true')
    expect(skeleton).toBeEmptyDOMElement()
    expect(skeleton).toHaveClass('animate-pulse', 'rounded-md', 'bg-accent', 'h-4', 'w-32')
  })

  it('merges custom classes and forwards placeholder props', () => {
    render(
      <Skeleton data-testid="skeleton" className="size-6 rounded-full" style={{ opacity: 0.5 }} />,
    )

    const skeleton = screen.getByTestId('skeleton')

    expect(skeleton).toHaveClass('size-6', 'rounded-full')
    expect(skeleton).toHaveStyle({ opacity: '0.5' })
  })
})
