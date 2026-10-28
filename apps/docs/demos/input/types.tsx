import { useState } from 'react'

import { Input, Label } from '@fish-admin/react'

export default function InputTypes() {
  const [email, setEmail] = useState('ada@fish-admin')
  const invalid = !email.includes('@') || !email.split('@')[1]?.includes('.')

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-stack" style={{ gap: '0.4rem' }}>
        <Label htmlFor="demo-input-types-text">Project name</Label>
        <Input id="demo-input-types-text" defaultValue="Apollo migration" />
        <p className="fish-demo-muted">
          Omit <code>type</code> and the native default, text, applies.
        </p>
      </div>

      <div className="fish-demo-stack" style={{ gap: '0.4rem' }}>
        <Label htmlFor="demo-input-types-email">Billing email</Label>
        <Input
          id="demo-input-types-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={invalid ? true : undefined}
          aria-describedby="demo-input-types-email-hint"
        />
        <p id="demo-input-types-email-hint" className="fish-demo-muted">
          {invalid
            ? 'Enter an address like finance@acme.dev.'
            : 'Invoices are sent to this address.'}
        </p>
      </div>

      <div className="fish-demo-stack" style={{ gap: '0.4rem' }}>
        <Label htmlFor="demo-input-types-password">Password</Label>
        <Input
          id="demo-input-types-password"
          type="password"
          placeholder="At least 12 characters"
          aria-describedby="demo-input-types-password-hint"
        />
        <p id="demo-input-types-password-hint" className="fish-demo-muted">
          <code>type=&quot;password&quot;</code> masks the value while keeping it typeable.
        </p>
      </div>

      <div className="fish-demo-stack" style={{ gap: '0.4rem' }}>
        <Label htmlFor="demo-input-types-disabled" style={{ opacity: 0.5 }}>
          Workspace slug
        </Label>
        <Input id="demo-input-types-disabled" defaultValue="acme-platform" disabled />
        <p className="fish-demo-muted">
          A disabled field keeps its value visible but is skipped by the Tab order.
        </p>
      </div>
    </div>
  )
}
