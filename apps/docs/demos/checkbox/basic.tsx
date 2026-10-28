import { useState } from 'react'

import { Checkbox, Label } from '@fish-admin/react'

export default function CheckboxBasic() {
  const [updates, setUpdates] = useState(true)

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-row" style={{ alignItems: 'flex-start' }}>
        <Checkbox
          id="demo-checkbox-updates"
          checked={updates}
          onCheckedChange={(checked) => setUpdates(checked === true)}
          aria-describedby="demo-checkbox-updates-description"
        />
        <div>
          <Label htmlFor="demo-checkbox-updates">Product updates</Label>
          <p
            id="demo-checkbox-updates-description"
            className="fish-demo-muted"
            style={{ margin: '0.35rem 0 0' }}
          >
            A monthly summary of shipped changes. No marketing email.
          </p>
        </div>
      </div>
      <p className="fish-demo-muted" aria-live="polite">
        Product updates are {updates ? 'on' : 'off'}.
      </p>
    </div>
  )
}
