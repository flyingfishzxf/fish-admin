import { useState } from 'react'

import { Input, Label } from '@fish-admin/react'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function InputBasic() {
  const [email, setEmail] = useState('')
  const valid = EMAIL_PATTERN.test(email)

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-stack" style={{ gap: '0.4rem' }}>
        <Label htmlFor="demo-input-email">Work email</Label>
        <Input
          id="demo-input-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@company.com"
          aria-describedby="demo-input-email-hint"
        />
        <p id="demo-input-email-hint" className="fish-demo-muted">
          {email.length === 0
            ? 'Used only for workspace invitations.'
            : valid
              ? `Invitations will be sent to ${email}.`
              : 'Keep typing — an address needs an @ and a domain.'}
        </p>
      </div>
    </div>
  )
}
