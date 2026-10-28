import { type CSSProperties } from 'react'

import { ScrollArea } from '@fish-admin/react'

const ROWS = [
  'Round-robin assignment',
  'Auto-close after 7 days',
  'Escalate on first reply',
  'Require a resolution note',
  'Notify the on-call channel',
  'Sync status to Linear',
  'Archive empty queues',
]

const BOX: CSSProperties = {
  width: 200,
  height: 132,
  border: '1px solid var(--border)',
  borderRadius: '0.5rem',
}

export default function ScrollAreaVisibility() {
  return (
    <div className="fish-demo-stack" style={{ maxWidth: '32rem' }}>
      <div className="fish-demo-row" style={{ alignItems: 'flex-start' }}>
        <div style={{ display: 'grid', gap: '0.375rem' }}>
          <span className="fish-demo-label">Default (type=&quot;hover&quot;)</span>
          <ScrollArea style={BOX}>
            <ul
              style={{
                margin: 0,
                padding: '0.5rem 1.25rem 0.5rem 1.25rem',
                fontSize: '0.78rem',
              }}
            >
              {ROWS.map((row) => (
                <li key={row} style={{ padding: '0.2rem 0' }}>
                  {row}
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
        <div style={{ display: 'grid', gap: '0.375rem' }}>
          <span className="fish-demo-label">type=&quot;always&quot;</span>
          <ScrollArea type="always" style={BOX}>
            <ul
              style={{
                margin: 0,
                padding: '0.5rem 1.25rem 0.5rem 1.25rem',
                fontSize: '0.78rem',
              }}
            >
              {ROWS.map((row) => (
                <li key={row} style={{ padding: '0.2rem 0' }}>
                  {row}
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      </div>
      <p className="fish-demo-muted">
        With the default hover mode the 10 px bar fades in on hover and hides again 600 ms after the
        pointer leaves. Passing type=&quot;always&quot; keeps the thumb painted, which suits panels
        where overflow must be obvious.
      </p>
    </div>
  )
}
