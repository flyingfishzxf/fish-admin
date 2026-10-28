import { useState } from 'react'

import { Transfer, type TransferItem } from '@fish-admin/react'

const ITEMS: TransferItem[] = [
  { key: 'ada', label: 'Ada Lovelace', description: 'Analytics' },
  { key: 'grace', label: 'Grace Hopper', description: 'Platform' },
  { key: 'katherine', label: 'Katherine Johnson', description: 'Simulation' },
  { key: 'linus', label: 'Linus Torvalds', description: 'Kernel' },
  { key: 'margaret', label: 'Margaret Hamilton', description: 'Flight software' },
]

export default function TransferBasic() {
  const [value, setValue] = useState<string[]>(['grace'])

  return (
    <div className="fish-demo-stack" style={{ maxWidth: '40rem' }}>
      <Transfer
        items={ITEMS}
        value={value}
        onChange={setValue}
        sourceTitle="Team members"
        targetTitle="Reviewers"
        emptySourceLabel="Everyone is assigned"
        emptyTargetLabel="No reviewers yet"
      />
      <p className="fish-demo-muted" aria-live="polite" style={{ margin: 0 }}>
        {`${value.length} of ${ITEMS.length} members assigned. `}
        {value.length > 0 ? `Keys in value: ${value.join(', ')}.` : 'The value is an empty array.'}
      </p>
    </div>
  )
}
