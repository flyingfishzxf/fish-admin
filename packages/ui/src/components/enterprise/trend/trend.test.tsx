import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { Trend } from './trend'

describe('Trend', () => {
  beforeEach(async () => {})

  it('exposes the signed value and context as one accessible label', () => {
    render(<Trend value={12.4} label="vs last month" />)

    const trend = screen.getByRole('img', { name: '+12.4% vs last month' })
    expect(trend).toHaveTextContent('+12.4%')
    expect(trend).toHaveTextContent('vs last month')
    expect(trend.className).toContain('text-success')
  })

  it('renders negative values with the destructive tone', () => {
    render(<Trend value={-0.6} />)

    expect(screen.getByText('-0.6%')).toBeInTheDocument()
    expect(screen.getByRole('img').className).toContain('text-destructive')
  })

  it('flips the tone when a lower value is better', () => {
    render(<Trend value={-0.6} invert />)

    expect(screen.getByRole('img').className).toContain('text-success')
  })

  it('renders zero as a flat change', () => {
    render(<Trend value={0} />)

    expect(screen.getByText('0%')).toBeInTheDocument()
    expect(screen.getByRole('img').className).toContain('text-muted-foreground')
  })
})
