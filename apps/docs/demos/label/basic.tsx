import { useState } from 'react'

import { Input, Label } from '@fish-admin/react'

export default function LabelBasic() {
  const [endpoint, setEndpoint] = useState('https://hooks.acme.dev/audit')

  return (
    <div className="fish-demo-stack">
      <div>
        <Label htmlFor="demo-label-webhook">Webhook URL</Label>
        <Input
          id="demo-label-webhook"
          value={endpoint}
          onChange={(event) => setEndpoint(event.target.value)}
          style={{ marginTop: '0.5rem' }}
        />
        <p className="fish-demo-muted" style={{ margin: '0.5rem 0 0' }}>
          Selecting the label moves focus into the input, because its htmlFor matches the input id.
        </p>
        <p className="fish-demo-muted" style={{ margin: '0.25rem 0 0' }}>
          Value: {endpoint || '(empty)'}
        </p>
      </div>
    </div>
  )
}
