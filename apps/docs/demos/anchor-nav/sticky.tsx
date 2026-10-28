import { useRef } from 'react'

import { AnchorNav, type AnchorItem } from '@fish-admin/react'

const SECTIONS: AnchorItem[] = [
  { id: 'demo-anchor-settings-general', label: 'General' },
  { id: 'demo-anchor-settings-members', label: 'Members' },
  { id: 'demo-anchor-settings-billing', label: 'Billing' },
  { id: 'demo-anchor-settings-integrations', label: 'Integrations' },
]

const COPY: Record<string, string> = {
  'demo-anchor-settings-general':
    'Workspace name, URL slug and the default language for new members.',
  'demo-anchor-settings-members': 'Invite people, change roles and set the domain auto-join rule.',
  'demo-anchor-settings-billing': 'Plan, seats and the invoice email that finance keeps on file.',
  'demo-anchor-settings-integrations':
    'Connected apps, API keys and the webhook endpoint used by the incident bot.',
}

export default function AnchorNavSticky() {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div className="fish-demo-stack">
      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: 8,
          overflow: 'hidden',
          width: '100%',
        }}
      >
        <div
          ref={scrollRef}
          role="region"
          aria-label="Workspace settings content"
          tabIndex={0}
          style={{ height: 248, overflowY: 'auto' }}
        >
          <div
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 1,
              background: 'var(--card)',
              padding: '0 0.5rem',
            }}
          >
            <AnchorNav
              items={SECTIONS}
              ariaLabel="Workspace settings sections"
              rootRef={scrollRef}
              offset={44}
              orientation="horizontal"
            />
          </div>
          <div style={{ padding: '0.75rem' }}>
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
            {/* room after the last section, so it can scroll up under the sticky bar */}
            <div aria-hidden style={{ height: 160 }} />
          </div>
        </div>
      </div>
      <p className="fish-demo-muted">
        The bar sticks to the top of the panel and pages through the same sections with a bottom
        rule instead of a left rail.
      </p>
    </div>
  )
}
