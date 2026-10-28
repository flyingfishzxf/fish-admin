import { useState } from 'react'
import { toast } from 'sonner'

import { Button, Result, type ResultStatus } from '@fish-admin/react'

const STATUSES: {
  value: ResultStatus
  label: string
  title: string
  description: string
}[] = [
  {
    value: 'success',
    label: 'Success',
    title: 'Deployment finished',
    description: 'Version 2.4.1 is live on production in all three regions.',
  },
  {
    value: 'info',
    label: 'Info',
    title: 'Invitation pending',
    description: 'Mina Park has not accepted yet. The link expires in six days.',
  },
  {
    value: 'warning',
    label: 'Warning',
    title: 'Two seats left',
    description: 'The Growth plan is nearly full. Add seats before inviting more members.',
  },
  {
    value: 'error',
    label: 'Error',
    title: 'Payment failed',
    description: 'The card ending in 4242 was declined. Update it to keep the workspace active.',
  },
  {
    value: 'not-found',
    label: 'Not found',
    title: 'No audit entry here',
    description: 'The record may have been archived. Search the audit log by actor instead.',
  },
]

export default function ResultStates() {
  const [status, setStatus] = useState<ResultStatus>('error')
  const active = STATUSES.find((item) => item.value === status) ?? STATUSES[0]!

  return (
    <div className="fish-demo-stack" style={{ maxWidth: 'none' }}>
      <div className="fish-demo-row" role="group" aria-label="Result status examples">
        {STATUSES.map((item) => (
          <Button
            key={item.value}
            size="sm"
            variant={item.value === status ? 'default' : 'outline'}
            aria-pressed={item.value === status}
            onClick={() => setStatus(item.value)}
          >
            {item.label}
          </Button>
        ))}
      </div>
      <Result
        status={active.value}
        title={active.title}
        description={active.description}
        extra={
          <Button variant="outline" size="sm" onClick={() => toast('Retry belongs to your flow.')}>
            Try again
          </Button>
        }
      />
      <p className="fish-demo-muted">
        The error variant renders with role="alert"; every other status uses role="status".
      </p>
    </div>
  )
}
