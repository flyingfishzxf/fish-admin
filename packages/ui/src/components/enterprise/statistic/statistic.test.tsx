import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { Statistic } from './statistic'

describe('Statistic', () => {
  beforeEach(async () => {})

  it('formats numeric values with the requested precision', () => {
    render(<Statistic label="Revenue" value={1234.5} precision={2} prefix="$" />)

    expect(screen.getByText('Revenue')).toBeInTheDocument()
    expect(screen.getByText('1,234.50')).toBeInTheDocument()
    expect(screen.getByText('$')).toBeInTheDocument()
  })

  it('renders string values verbatim', () => {
    render(<Statistic label="Uptime" value="99.98%" precision={2} />)

    expect(screen.getByText('99.98%')).toBeInTheDocument()
  })

  it('renders a positive trend with its sign in the accessible label', () => {
    render(
      <Statistic label="Revenue" value={1234.5} trend={{ value: 12.4, label: 'vs last month' }} />,
    )

    expect(screen.getByText('+12.4%')).toBeInTheDocument()
    expect(screen.getByText('vs last month')).toBeInTheDocument()
    expect(screen.getByLabelText('Revenue +12.4% vs last month')).toBeInTheDocument()
  })

  it('renders negative and zero trends with semantic tones', () => {
    const { rerender } = render(<Statistic label="Revenue" value={100} trend={{ value: -3.2 }} />)

    const negative = screen.getByLabelText('Revenue -3.2%')
    expect(negative).toHaveTextContent('-3.2%')
    expect(negative.className).toContain('text-destructive')

    rerender(<Statistic label="Revenue" value={100} trend={{ value: 0 }} />)

    const flat = screen.getByLabelText('Revenue 0%')
    expect(flat).toHaveTextContent('0%')
    expect(flat.className).toContain('text-muted-foreground')
  })

  it('renders skeleton blocks while loading', () => {
    render(<Statistic label="Revenue" value={1234} loading />)

    expect(screen.getByText('Revenue')).toBeInTheDocument()
    expect(screen.queryByText('1,234')).not.toBeInTheDocument()
    expect(document.querySelector('[data-slot="statistic"]')).toHaveAttribute('aria-busy', 'true')
    expect(document.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(2)
  })
})
