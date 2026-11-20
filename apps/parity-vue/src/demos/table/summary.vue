<script lang="ts">
export default { name: 'TableSummary' }
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'

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
} from '@fish-admin/vue'

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

const hidePaid = ref(false)
const rows = computed(() =>
  hidePaid.value ? INVOICES.filter((invoice) => invoice.status !== 'paid') : INVOICES,
)
const total = computed(() => rows.value.reduce((sum, invoice) => sum + invoice.amount, 0))

function formatAmount(value: number) {
  return `$${value.toFixed(2)}`
}
</script>

<template>
  <div class="fish-demo-stack" style="max-width: 36rem">
    <div class="fish-demo-row">
      <Switch id="demo-table-hide-paid" v-model="hidePaid" />
      <Label for="demo-table-hide-paid">Hide paid invoices</Label>
    </div>
    <Table>
      <TableCaption>Workspace invoices, August to October 2026.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead style="text-align: right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="invoice in rows" :key="invoice.id">
          <TableCell>{{ invoice.id }}</TableCell>
          <TableCell class="fish-demo-muted">{{ invoice.date }}</TableCell>
          <TableCell>
            <Badge :variant="STATUS_VARIANTS[invoice.status]">
              {{ STATUS_LABELS[invoice.status] }}
            </Badge>
          </TableCell>
          <TableCell style="text-align: right; font-variant-numeric: tabular-nums">
            {{ formatAmount(invoice.amount) }}
          </TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell :col-span="3">{{ `Total (${rows.length} invoices)` }}</TableCell>
          <TableCell style="text-align: right; font-variant-numeric: tabular-nums">
            {{ formatAmount(total) }}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
    <p class="fish-demo-muted" style="margin: 0">
      The footer row holds the running total; hiding paid invoices recomputes it live.
    </p>
  </div>
</template>
