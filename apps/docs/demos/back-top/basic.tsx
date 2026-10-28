import { useRef } from 'react'

import { BackTop } from '@fish-admin/react'

const ENTRIES = [
  '09:41 ada.lovelace changed the billing plan to Enterprise',
  '09:38 grace.hopper invited 4 members to Platform',
  '09:22 service-bot rotated the staging API key',
  '09:05 alan.turing exported the Q3 revenue report',
  '08:57 katherine.johnson archived project Atlas',
  '08:44 service-bot deployed api@2.18.0 to production',
  '08:31 ada.lovelace updated the SSO domain',
  '08:12 grace.hopper closed incident INC-2041',
  '07:58 alan.turing created the growth-experiments key',
  '07:40 katherine.johnson changed alan.turing’s role to Viewer',
  '07:19 service-bot ran the nightly retention job',
  '06:55 ada.lovelace restored the design-tokens file',
  '06:31 grace.hopper connected the Slack integration',
  '06:04 service-bot archived 30-day audit exports',
  '05:48 alan.turing requested access to the finance export',
]

export default function BackTopBasic() {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div className="fish-demo-stack">
      {/* transform creates a containing block, so the fixed-position button stays inside the card */}
      <div
        style={{
          position: 'relative',
          transform: 'translateZ(0)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          overflow: 'hidden',
          width: '100%',
        }}
      >
        <div
          ref={scrollRef}
          role="region"
          aria-label="Audit log entries"
          tabIndex={0}
          style={{ height: 184, overflowY: 'auto', padding: '0.75rem' }}
        >
          <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>Audit log · today</p>
          <ul
            style={{
              margin: '0.5rem 0 0',
              paddingLeft: '1rem',
              fontSize: '0.78rem',
              color: 'var(--muted-foreground)',
              lineHeight: 1.6,
            }}
          >
            {ENTRIES.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        </div>
        <BackTop targetRef={scrollRef} threshold={80} label="Back to the top of the audit log" />
      </div>
      <p className="fish-demo-muted">
        Scroll the panel past 80 px and the round button appears in its bottom-right corner.
      </p>
    </div>
  )
}
