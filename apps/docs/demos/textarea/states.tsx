import { useState } from 'react'

import { Label, Textarea } from '@fish-admin/react'

const MIN_REASON = 12

export default function TextareaStates() {
  const [reason, setReason] = useState('')
  const tooShort = reason.trim().length < MIN_REASON

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-stack" style={{ gap: '0.4rem' }}>
        <Label htmlFor="demo-textarea-states-disabled" style={{ opacity: 0.5 }}>
          Resolution summary
        </Label>
        <Textarea
          id="demo-textarea-states-disabled"
          rows={3}
          disabled
          defaultValue="Refund approved by finance; the duplicate charge is reversed."
          aria-describedby="demo-textarea-states-disabled-hint"
        />
        <p id="demo-textarea-states-disabled-hint" className="fish-demo-muted">
          Read-only once the request is resolved; the reviewer writes it while closing.
        </p>
      </div>

      <div className="fish-demo-stack" style={{ gap: '0.4rem' }}>
        <Label htmlFor="demo-textarea-states-invalid">Rejection reason</Label>
        <Textarea
          id="demo-textarea-states-invalid"
          rows={3}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          aria-invalid={tooShort ? true : undefined}
          aria-describedby="demo-textarea-states-invalid-hint"
          placeholder="Explain what the requester should change…"
        />
        <p id="demo-textarea-states-invalid-hint" className="fish-demo-muted">
          {tooShort
            ? `A rejection needs at least ${MIN_REASON} characters so the requester knows what to fix.`
            : 'The requester receives this text in the notification email.'}
        </p>
      </div>
    </div>
  )
}
