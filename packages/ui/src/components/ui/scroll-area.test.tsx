import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ScrollArea } from './scroll-area'

describe('ScrollArea', () => {
  it('renders the viewport content and an always-visible scrollbar', () => {
    const { container } = render(
      <ScrollArea type="always" className="h-40 w-64">
        <div>Audit entry 1</div>
        <div>Audit entry 2</div>
      </ScrollArea>,
    )

    const viewport = container.querySelector('[data-slot="scroll-area-viewport"]')
    const scrollbar = container.querySelector('[data-slot="scroll-area-scrollbar"]')

    expect(viewport).toHaveAttribute('tabindex', '0')
    expect(viewport).toContainElement(screen.getByText('Audit entry 1'))
    expect(viewport).toContainElement(screen.getByText('Audit entry 2'))
    expect(scrollbar).toHaveAttribute('data-orientation', 'vertical')
    expect(scrollbar).toHaveAttribute('data-state', 'visible')
  })

  it('merges root classes and forwards root props', () => {
    render(
      <ScrollArea data-testid="scroller" className="h-40 w-64" aria-busy="true">
        <p>Audit entry</p>
      </ScrollArea>,
    )

    const root = screen.getByTestId('scroller')

    expect(root).toHaveAttribute('data-slot', 'scroll-area')
    expect(root).toHaveAttribute('aria-busy', 'true')
    expect(root).toHaveClass('relative', 'h-40', 'w-64')
    expect(root.querySelector('[data-slot="scroll-area-viewport"]')).toContainElement(
      screen.getByText('Audit entry'),
    )
  })
})
