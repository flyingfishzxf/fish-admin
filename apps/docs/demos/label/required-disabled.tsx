import { useState } from 'react'

import { Input, Label } from '@fish-admin/react'

export default function LabelRequiredDisabled() {
  const [owner, setOwner] = useState('')

  return (
    <div className="fish-demo-stack">
      <div>
        <Label htmlFor="demo-label-owner">
          Owner email
          <span aria-hidden="true" style={{ color: 'var(--destructive)' }}>
            *
          </span>
        </Label>
        <Input
          id="demo-label-owner"
          type="email"
          required
          value={owner}
          onChange={(event) => setOwner(event.target.value)}
          placeholder="owner@company.com"
          style={{ marginTop: '0.5rem' }}
        />
        <p className="fish-demo-muted" style={{ margin: '0.5rem 0 0' }}>
          {owner.trim() === ''
            ? 'The asterisk is decorative; the input carries required, so a native form blocks submit while this is empty.'
            : 'The input has a value, so the required check passes.'}
        </p>
      </div>
      <div>
        <Label htmlFor="demo-label-billing" style={{ opacity: 0.5 }}>
          Billing email
        </Label>
        <Input
          id="demo-label-billing"
          type="email"
          defaultValue="finance@acme.dev"
          disabled
          style={{ marginTop: '0.5rem' }}
        />
        <p className="fish-demo-muted" style={{ margin: '0.5rem 0 0' }}>
          Managed by the billing provider, so the field stays visible but disabled.
        </p>
      </div>
    </div>
  )
}
