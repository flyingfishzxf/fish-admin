import { useState } from 'react'

import { Label, Switch } from '@fish-admin/react'

export default function SwitchSizes() {
  const [digest, setDigest] = useState(true)
  const [mentions, setMentions] = useState(false)

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-row" style={{ justifyContent: 'space-between' }}>
        <Label htmlFor="demo-switch-digest">Weekly digest</Label>
        <Switch
          id="demo-switch-digest"
          checked={digest}
          onCheckedChange={(checked) => setDigest(checked)}
        />
      </div>
      <div className="fish-demo-row" style={{ justifyContent: 'space-between' }}>
        <Label htmlFor="demo-switch-mentions">Mentions only</Label>
        <Switch
          id="demo-switch-mentions"
          size="sm"
          checked={mentions}
          onCheckedChange={(checked) => setMentions(checked)}
        />
      </div>
      <div
        className="fish-demo-row"
        style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}
      >
        <div>
          <Label htmlFor="demo-switch-streaming">Audit log streaming</Label>
          <p className="fish-demo-muted" style={{ margin: '0.35rem 0 0' }}>
            Disabled because streaming is part of the Enterprise plan.
          </p>
        </div>
        <Switch id="demo-switch-streaming" disabled />
      </div>
      <p className="fish-demo-muted">
        The first row uses the default track (18.4 × 32 px); the second uses <code>size="sm"</code>{' '}
        (14 × 24 px).
      </p>
    </div>
  )
}
