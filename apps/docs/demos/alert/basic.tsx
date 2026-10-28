import { useState } from 'react'

import { Alert, AlertDescription, AlertTitle, Button } from '@fish-admin/react'
import { ShieldCheck } from 'lucide-react'

export default function AlertBasic() {
  const [requested, setRequested] = useState(false)

  return (
    <div className="fish-demo-stack">
      <Alert>
        <ShieldCheck aria-hidden="true" />
        <AlertTitle>Service tokens must be rotated</AlertTitle>
        <AlertDescription>
          <p style={{ margin: 0 }}>
            Tokens issued before October 1 stop working in 3 days. Rotate them to keep CI
            deployments running.
          </p>
          <Button
            size="sm"
            variant={requested ? 'ghost' : 'outline'}
            onClick={() => setRequested((current) => !current)}
          >
            {requested ? 'Cancel request' : 'Request rotation'}
          </Button>
          <p className="fish-demo-muted" style={{ margin: 0 }}>
            {requested ? 'Rotation requested for 9 tokens.' : '9 tokens are affected.'}
          </p>
        </AlertDescription>
      </Alert>
      <p className="fish-demo-muted" style={{ margin: 0 }}>
        The alert is mounted with the page, so it announces itself as soon as the preview renders.
      </p>
    </div>
  )
}
