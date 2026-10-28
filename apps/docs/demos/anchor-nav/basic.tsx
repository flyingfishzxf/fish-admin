import { useRef } from 'react'

import { AnchorNav, type AnchorItem } from '@fish-admin/react'

const SECTIONS: AnchorItem[] = [
  { id: 'demo-anchor-report-summary', label: 'Summary' },
  { id: 'demo-anchor-report-headcount', label: 'Headcount' },
  { id: 'demo-anchor-report-spend', label: 'Spend' },
  { id: 'demo-anchor-report-risks', label: 'Risks' },
]

const COPY: Record<string, string> = {
  'demo-anchor-report-summary':
    'Revenue closed at $4.82M for the quarter, 6% above plan. Enterprise renewals landed ahead of schedule.',
  'demo-anchor-report-headcount':
    '142 people across nine squads. Three backend roles opened this week and interviews start on Monday.',
  'demo-anchor-report-spend':
    'Cloud spend is tracking 4% under budget after the October rightsizing pass.',
  'demo-anchor-report-risks':
    'Two vendor contracts expire in December; legal review starts next sprint.',
}

export default function AnchorNavBasic() {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div className="fish-demo-stack">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '8.5rem minmax(0, 1fr)',
          gap: '1rem',
          width: '100%',
        }}
      >
        <AnchorNav items={SECTIONS} ariaLabel="Report sections" rootRef={scrollRef} offset={8} />
        <div
          ref={scrollRef}
          role="region"
          aria-label="Report sections content"
          tabIndex={0}
          style={{
            height: 232,
            overflowY: 'auto',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '0.75rem',
          }}
        >
          {SECTIONS.map((item) => (
            <section key={item.id} id={item.id} style={{ marginBottom: '1rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>{item.label}</h4>
              <p
                style={{
                  margin: '0.25rem 0 0',
                  fontSize: '0.8rem',
                  color: 'var(--muted-foreground)',
                }}
              >
                {COPY[item.id]}
              </p>
            </section>
          ))}
          {/* room after the last section, so it can scroll up to the offset line */}
          <div aria-hidden style={{ height: 160 }} />
        </div>
      </div>
      <p className="fish-demo-muted">
        Scroll the panel: the rail marks the last section whose top has crossed the offset line.
      </p>
    </div>
  )
}
