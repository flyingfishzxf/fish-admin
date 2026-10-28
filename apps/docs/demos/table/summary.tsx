import { useState } from 'react'

import {
  Badge,
  Label,
  Switch,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@fish-admin/react'

interface Invoice {
  id: string
  date: string
  amount: number
  status: 'paid' | 'open' | 'overdue'
}

const INVOICES: Invoice[] = [
  { id: 'INV-1042', date: '2026-10-01', amount: 1339.2, status: 'paid' },
  { id: 'INV-1041', date: '2026-09-01', amount: 1339.2, status: 'open' },
  { id: 'INV-1040', date: '2026-08-01', amount: 1240, status: 'overdue' },
]

const STATUS_LABELS: Record<Invoice['status'], string> = {
  paid: 'Paid',
  open: 'Open',
  overdue: 'Overdue',
}

const STATUS_VARIANTS = {
  paid: 'secondary',
  open: 'outline',
  overdue: 'destructive',
} as const

function formatAmount(value: number) {
  return `$${value.toFixed(2)}`
}

export default function TableSummary() {
  const [hidePaid, setHidePaid] = useState(false)
  const rows = hidePaid ? INVOICES.filter((invoice) => invoice.status !== 'paid') : INVOICES
  const total = rows.reduce((sum, invoice) => sum + invoice.amount, 0)

  return (
    <div className="fish-demo-stack" style={{ maxWidth: '36rem' }}>
      <div className="fish-demo-row">
        <Switch id="demo-table-hide-paid" checked={hidePaid} onCheckedChange={setHidePaid} />
        <Label htmlFor="demo-table-hide-paid">Hide paid invoices</Label>
      </div>
      <Table>
        <TableCaption>Workspace invoices, August to October 2026.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead style={{ textAlign: 'right' }}>Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell>{invoice.id}</TableCell>
              <TableCell className="fish-demo-muted">{invoice.date}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANTS[invoice.status]}>
                  {STATUS_LABELS[invoice.status]}
                </Badge>
              </TableCell>
              <TableCell style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {formatAmount(invoice.amount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>{`Total (${rows.length} invoices)`}</TableCell>
            <TableCell style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {formatAmount(total)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}
