import { useState } from 'react'

import { Badge, Button } from '@fish-admin/react'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'

const STATUSES = [
  {
    id: 'active',
    label: 'Active',
    variant: 'default',
    icon: CheckCircle2,
    hint: 'Billing is current, so seats can be added at any time.',
  },
  {
    id: 'trial',
    label: 'Trial',
    variant: 'secondary',
    icon: Clock,
    hint: '14 days remain in the trial; invited members do not count yet.',
  },
  {
    id: 'past-due',
    label: 'Past due',
    variant: 'destructive',
    icon: XCircle,
    hint: 'The card ending 4242 was declined three days ago.',
  },
] as const

type StatusId = (typeof STATUSES)[number]['id']

export default function BadgeStatus() {
  const [status, setStatus] = useState<StatusId>('active')
  const current = STATUSES.find((item) => item.id === status) ?? STATUSES[0]
  const Icon = current.icon

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-row">
        <Badge variant={current.variant}>
          <span aria-hidden="true" style={{ fontSize: '0.45rem', lineHeight: 1 }}>
            ●
          </span>
          <Icon aria-hidden="true" />
          {current.label}
        </Badge>
        <span className="fish-demo-muted">{current.hint}</span>
      </div>
      <div className="fish-demo-row">
        {STATUSES.map((item) => (
          <Button
            key={item.id}
            size="sm"
            variant={item.id === status ? 'default' : 'outline'}
            aria-pressed={item.id === status}
            onClick={() => setStatus(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>
      <p className="fish-demo-muted" style={{ margin: 0 }}>
        The dot is a decorative span; the icon and label carry the meaning, so the badge still reads
        correctly without colour.
      </p>
    </div>
  )
}
