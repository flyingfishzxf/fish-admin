import { useRef } from 'react'

import { BackTop } from '@fish-admin/react'

const ROWS = Array.from(
  { length: 24 },
  (_, index) => `Batch ${index + 1} · reconciled ${index * 7 + 3} invoices`,
)

export default function BackTopThreshold() {
  const earlyRef = useRef<HTMLDivElement>(null)
  const lateRef = useRef<HTMLDivElement>(null)

  return (
    <div className="fish-demo-stack">
      <div>
        <p className="fish-demo-label">Threshold 40 px</p>
        <div
          style={{
            position: 'relative',
            transform: 'translateZ(0)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <div
            ref={earlyRef}
            role="region"
            aria-label="Invoice batches, early threshold"
            tabIndex={0}
            style={{ height: 150, overflowY: 'auto', padding: '0.6rem 0.75rem' }}
          >
            <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.78rem', lineHeight: 1.7 }}>
              {ROWS.map((row) => (
                <li key={row}>{row}</li>
              ))}
            </ul>
          </div>
          <BackTop
            targetRef={earlyRef}
            threshold={40}
            label="Back to the start of the invoice batches"
          />
        </div>
      </div>
      <div>
        <p className="fish-demo-label">Threshold 240 px</p>
        <div
          style={{
            position: 'relative',
            transform: 'translateZ(0)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <div
            ref={lateRef}
            role="region"
            aria-label="Payout batches, late threshold"
            tabIndex={0}
            style={{ height: 150, overflowY: 'auto', padding: '0.6rem 0.75rem' }}
          >
            <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.78rem', lineHeight: 1.7 }}>
              {ROWS.map((row) => (
                <li key={row}>{row}</li>
              ))}
            </ul>
          </div>
          <BackTop
            targetRef={lateRef}
            threshold={240}
            label="Back to the start of the payout batches"
          />
        </div>
      </div>
      <p className="fish-demo-muted">
        Both panels hold the same list; only the scroll distance before the button appears differs.
      </p>
    </div>
  )
}
