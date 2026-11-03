import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card'

function InvoiceCard() {
  return (
    <Card data-testid="invoice-card">
      <CardHeader>
        <CardTitle>Invoice #1042</CardTitle>
        <CardDescription>Issued on 12 October 2026</CardDescription>
        <CardAction>
          <button type="button">Download</button>
        </CardAction>
      </CardHeader>
      <CardContent>Total due: $1,240.00</CardContent>
      <CardFooter>
        <span>Due in 14 days</span>
      </CardFooter>
    </Card>
  )
}

describe('Card', () => {
  it('renders the header, title, description, action, content and footer slots', () => {
    render(<InvoiceCard />)

    const card = screen.getByTestId('invoice-card')
    const header = card.querySelector('[data-slot="card-header"]')
    const footer = card.querySelector('[data-slot="card-footer"]')

    expect(card).toHaveAttribute('data-slot', 'card')
    expect(header).not.toBeNull()
    expect(footer).not.toBeNull()
    expect(header).toContainElement(screen.getByText('Invoice #1042'))
    expect(header).toContainElement(screen.getByText('Issued on 12 October 2026'))
    expect(header).toContainElement(screen.getByRole('button', { name: 'Download' }))
    expect(card).toContainElement(screen.getByText('Total due: $1,240.00'))
    expect(footer).toContainElement(screen.getByText('Due in 14 days'))

    expect(screen.getByText('Invoice #1042')).toHaveAttribute('data-slot', 'card-title')
    expect(screen.getByText('Issued on 12 October 2026')).toHaveAttribute(
      'data-slot',
      'card-description',
    )
    expect(screen.getByText('Total due: $1,240.00')).toHaveAttribute('data-slot', 'card-content')
    expect(screen.getByRole('button', { name: 'Download' }).parentElement).toHaveAttribute(
      'data-slot',
      'card-action',
    )
    expect(within(footer as HTMLElement).getByText('Due in 14 days')).toBeVisible()
  })

  it('merges custom classes and forwards div props', () => {
    render(<Card data-testid="plain-card" className="border-dashed" aria-busy="true" />)

    const card = screen.getByTestId('plain-card')

    expect(card).toHaveAttribute('data-slot', 'card')
    expect(card).toHaveAttribute('aria-busy', 'true')
    expect(card).toHaveClass('flex', 'flex-col', 'rounded-xl', 'border-dashed')
  })
})
