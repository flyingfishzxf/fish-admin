import { useState } from 'react'

import { Transfer, type TransferItem } from '@fish-admin/react'

const ITEMS: TransferItem[] = [
  {
    key: 'api',
    label: 'payments-api',
    description: 'Card authorisation service',
    group: 'Backend',
    searchText: 'stripe gateway',
  },
  {
    key: 'ledger',
    label: 'ledger-core',
    description: 'Double-entry bookkeeping',
    group: 'Backend',
    searchText: 'accounting journal',
  },
  {
    key: 'checkout-web',
    label: 'checkout-web',
    description: 'Customer checkout SPA',
    group: 'Frontend',
    searchText: 'react storefront',
  },
  {
    key: 'mobile',
    label: 'mobile-app',
    description: 'iOS and Android client',
    group: 'Frontend',
    searchText: 'react native phone',
  },
  {
    key: 'main',
    label: 'monorepo-main',
    description: 'Locked during the code freeze',
    group: 'Archives',
    disabled: true,
  },
]

export default function TransferSearchable() {
  const [value, setValue] = useState<string[]>(['api'])

  return (
    <div className="fish-demo-stack" style={{ maxWidth: '40rem' }}>
      <Transfer
        items={ITEMS}
        value={value}
        onChange={setValue}
        sourceTitle="All repositories"
        targetTitle="Selected repositories"
        searchPlaceholder="Filter by name or stack"
        emptySourceLabel="No repositories match"
        emptyTargetLabel="Nothing scoped in yet"
      />
      <p className="fish-demo-muted" style={{ margin: 0 }}>
        Search matches <code>label</code>, <code>description</code> and <code>searchText</code>{' '}
        together; <code>Select all</code> only touches the filtered rows, and{' '}
        <code>monorepo-main</code> is <code>disabled</code> so it never moves.
      </p>
    </div>
  )
}
