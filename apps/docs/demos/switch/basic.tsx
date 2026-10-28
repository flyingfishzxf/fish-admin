import { useState } from 'react'

import { Label, Switch } from '@fish-admin/react'

export default function SwitchBasic() {
  const [enforced, setEnforced] = useState(true)

  return (
    <div className="fish-demo-stack">
      <div
        className="fish-demo-row"
        style={{
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '0.75rem',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <Label htmlFor="demo-switch-2fa">Two-factor authentication</Label>
          <p className="fish-demo-muted" style={{ margin: '0.35rem 0 0' }}>
            Require a one-time code from an authenticator app at sign-in.
          </p>
          <p
            className="fish-demo-label"
            style={{ margin: '0.35rem 0 0', color: 'var(--primary)', fontWeight: 500 }}
          >
            {enforced ? 'On for all members' : 'Off — password sign-in only'}
          </p>
        </div>
        <Switch
          id="demo-switch-2fa"
          checked={enforced}
          onCheckedChange={(checked) => setEnforced(checked)}
        />
      </div>
      <p className="fish-demo-muted">
        The switch is controlled: the status line reads the same state the thumb shows.
      </p>
    </div>
  )
}
