import { useState } from 'react'

import { Alert, AlertDescription, AlertTitle, Button } from '@fish-admin/react'
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'

const FAILURES = [
  { job: 'Nightly invoice export', detail: 'stalled at 02:14' },
  { job: 'Webhook retries for eu-west', detail: '42 events undelivered' },
  { job: 'SSO metadata refresh', detail: 'signing certificate expired' },
]

export default function AlertDestructive() {
  const [healthy, setHealthy] = useState(false)

  return (
    <div className="fish-demo-stack">
      <Alert variant={healthy ? 'default' : 'destructive'}>
        {healthy ? <CheckCircle2 aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}
        <AlertTitle>{healthy ? 'All jobs are healthy' : '3 background jobs failed'}</AlertTitle>
        <AlertDescription>
          {healthy ? (
            <p style={{ margin: 0 }}>
              The re-run finished without errors on October 27, 2026 at 10:05.
            </p>
          ) : (
            <>
              <p style={{ margin: 0 }}>
                These jobs stopped before completing, so downstream reports are incomplete:
              </p>
              <ul
                className="fish-demo-stack"
                style={{ gap: 4, margin: 0, padding: 0, listStyle: 'none' }}
              >
                {FAILURES.map((failure) => (
                  <li key={failure.job} className="fish-demo-row" style={{ gap: 6 }}>
                    <XCircle aria-hidden="true" size={14} />
                    <span>{failure.job}</span>
                    <span>({failure.detail})</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          <Button size="sm" variant="outline" onClick={() => setHealthy((current) => !current)}>
            {healthy ? 'Show the failed run' : 'Re-run checks'}
          </Button>
        </AlertDescription>
      </Alert>
      <p className="fish-demo-muted" style={{ margin: 0 }}>
        Each click alternates between a failed run and a clean re-run so both variants can be
        compared.
      </p>
    </div>
  )
}
