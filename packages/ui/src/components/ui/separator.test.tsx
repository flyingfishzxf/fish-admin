import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Separator } from './separator'

describe('Separator', () => {
  it('is decorative and hidden from assistive technology by default', () => {
    const { container } = render(<Separator />)
    const separator = container.querySelector('[data-slot="separator"]')

    expect(separator).toHaveAttribute('data-orientation', 'horizontal')
    expect(separator).toHaveAttribute('role', 'none')
    expect(separator).not.toHaveAttribute('aria-orientation')
    expect(screen.queryByRole('separator')).not.toBeInTheDocument()
  })

  it('exposes a horizontal separator when it is semantic', () => {
    render(<Separator decorative={false} />)

    const separator = screen.getByRole('separator')

    expect(separator).toHaveAttribute('data-orientation', 'horizontal')
    expect(separator).not.toHaveAttribute('aria-orientation')
  })

  it('reports the vertical orientation', () => {
    render(<Separator decorative={false} orientation="vertical" />)

    const separator = screen.getByRole('separator')

    expect(separator).toHaveAttribute('data-orientation', 'vertical')
    expect(separator).toHaveAttribute('aria-orientation', 'vertical')
  })
})
