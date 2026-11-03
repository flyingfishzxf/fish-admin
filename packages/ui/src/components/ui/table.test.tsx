import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './table'

function InvoicesTable() {
  return (
    <Table>
      <TableCaption>Invoices issued this quarter</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>#1042</TableCell>
          <TableCell>$1,240.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>#1043</TableCell>
          <TableCell>$860.00</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell>$2,100.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}

describe('Table', () => {
  it('exposes table semantics, row and cell counts and the caption', () => {
    const { container } = render(<InvoicesTable />)

    const table = screen.getByRole('table', { name: 'Invoices issued this quarter' })
    const wrapper = container.querySelector('[data-slot="table-container"]')

    expect(table).toHaveAttribute('data-slot', 'table')
    expect(wrapper).toContainElement(table)
    expect(wrapper).toHaveAttribute('tabindex', '0')
    expect(within(table).getAllByRole('columnheader')).toHaveLength(2)
    expect(within(table).getAllByRole('row')).toHaveLength(4)
    expect(within(table).getAllByRole('cell')).toHaveLength(6)
    expect(within(table).getByText('Invoices issued this quarter')).toHaveAttribute(
      'data-slot',
      'table-caption',
    )
    expect(within(table).getByRole('columnheader', { name: 'Invoice' })).toHaveAttribute(
      'data-slot',
      'table-head',
    )
  })

  it('can render without the scroll container', () => {
    const { container } = render(
      <Table container={false}>
        <TableBody>
          <TableRow>
            <TableCell>Bare table</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    )

    expect(container.querySelector('[data-slot="table-container"]')).toBeNull()
    expect(screen.getByRole('table')).toHaveAttribute('data-slot', 'table')
    expect(screen.getByRole('cell', { name: 'Bare table' })).toBeVisible()
  })
})
