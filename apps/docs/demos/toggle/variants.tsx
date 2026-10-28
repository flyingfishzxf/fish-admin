import { useState } from 'react'

import { Bell, Eye, Pin } from 'lucide-react'

import { Toggle } from '@fish-admin/react'

export default function ToggleVariants() {
  const [pinned, setPinned] = useState(true)
  const [watching, setWatching] = useState(false)
  const [notify, setNotify] = useState(false)
  const [archived, setArchived] = useState(false)

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-row">
        <Toggle
          size="sm"
          variant="outline"
          pressed={pinned}
          onPressedChange={setPinned}
          aria-label="Pin report"
        >
          <Pin />
          Pin
        </Toggle>
        <Toggle
          variant="outline"
          pressed={watching}
          onPressedChange={setWatching}
          aria-label="Watch report"
        >
          <Eye />
          Watch
        </Toggle>
        <Toggle
          size="lg"
          variant="outline"
          pressed={notify}
          onPressedChange={setNotify}
          aria-label="Notify me of changes"
        >
          <Bell />
          Notify
        </Toggle>
      </div>
      <div className="fish-demo-row">
        <Toggle pressed={archived} onPressedChange={setArchived}>
          Show archived
        </Toggle>
        <Toggle disabled>Sync</Toggle>
      </div>
      <p className="fish-demo-muted" style={{ margin: 0 }}>
        Outline toggles at <code>sm</code>, default and <code>lg</code>; the second row uses the
        default variant, which has no border until it is pressed. The disabled toggle keeps its
        height and drops to 50 % opacity.
      </p>
      <p className="fish-demo-muted" style={{ margin: 0 }} aria-live="polite">
        {`Pin ${pinned ? 'on' : 'off'} · Watch ${watching ? 'on' : 'off'} · Notify ${
          notify ? 'on' : 'off'
        }`}
      </p>
    </div>
  )
}
