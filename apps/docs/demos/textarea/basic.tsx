import { useState } from 'react'

import { Label, Textarea } from '@fish-admin/react'

const LIMIT = 280
const SEED = 'Duplicate charge confirmed with finance; refund approved on 2 Oct 2026.'

export default function TextareaBasic() {
  const [note, setNote] = useState(SEED)

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-stack" style={{ gap: '0.4rem' }}>
        <Label htmlFor="demo-textarea-note">Review notes</Label>
        <Textarea
          id="demo-textarea-note"
          rows={4}
          maxLength={LIMIT}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Summarize why this request should be approved…"
          aria-describedby="demo-textarea-note-count"
        />
        <p id="demo-textarea-note-count" className="fish-demo-muted">
          {note.length} / {LIMIT} characters · notes are attached to the audit event.
        </p>
      </div>
    </div>
  )
}
