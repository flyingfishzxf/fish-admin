import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Badge } from './badge'

describe('Badge', () => {
  it('uses the default variant classes', () => {
    render(<Badge>Active</Badge>)

    const badge = screen.getByText('Active')

    expect(badge).toHaveAttribute('data-slot', 'badge')
    expect(badge).toHaveAttribute('data-variant', 'default')
    expect(badge).toHaveClass('bg-primary', 'text-primary-foreground')
  })

  it.each([
    ['secondary', 'bg-secondary'],
    ['destructive', 'bg-destructive'],
    ['outline', 'border-border'],
    ['ghost', '[a&]:hover:bg-accent'],
    ['link', 'underline-offset-4'],
  ] as const)('maps the %s variant to its documented class', (variant, expectedClass) => {
    render(<Badge variant={variant}>{variant}</Badge>)

    const badge = screen.getByText(variant)

    expect(badge).toHaveAttribute('data-variant', variant)
    expect(badge).toHaveClass(expectedClass)
  })
})
