import { useState, type CSSProperties } from 'react'

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@fish-admin/react'

const TICKETS = [
  {
    id: 'SUP-1042',
    title: 'Members export stalls',
    requester: 'Ada Lovelace',
    priority: 'High',
    updated: '12 min ago',
    body: 'Exporting the members table to CSV stops at roughly 10,000 rows. The job never finishes and nothing is written to the error log.',
  },
  {
    id: 'SUP-1039',
    title: 'Invite email never arrives',
    requester: 'Grace Hopper',
    priority: 'Normal',
    updated: '1 h ago',
    body: 'Two invitations were sent to the design team this morning. Both addresses are valid but neither inbox shows a message or a spam hit.',
  },
  {
    id: 'SUP-1031',
    title: 'Audit log timezone',
    requester: 'Alan Turing',
    priority: 'Low',
    updated: 'Yesterday',
    body: 'Audit entries show UTC while the rest of the workspace uses the team timezone. Reviewers keep mis-reading the order of events.',
  },
]

const PANE: CSSProperties = { height: '100%', overflow: 'auto', padding: '0.75rem' }

export default function ResizableBasic() {
  const [selectedId, setSelectedId] = useState(TICKETS[0].id)
  const selected = TICKETS.find((ticket) => ticket.id === selectedId) ?? TICKETS[0]

  return (
    <div className="fish-demo-stack" style={{ maxWidth: '44rem' }}>
      <ResizablePanelGroup
        orientation="horizontal"
        style={{
          height: 240,
          border: '1px solid var(--border)',
          borderRadius: '0.5rem',
          overflow: 'hidden',
        }}
      >
        <ResizablePanel defaultSize="38" minSize="26">
          <div style={PANE} role="region" aria-label="Support queue" tabIndex={0}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', fontWeight: 600 }}>
              Support queue
            </p>
            <div style={{ display: 'grid', gap: '0.375rem' }}>
              {TICKETS.map((ticket) => {
                const active = ticket.id === selectedId
                return (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => setSelectedId(ticket.id)}
                    style={{
                      display: 'grid',
                      gap: '0.125rem',
                      width: '100%',
                      padding: '0.5rem',
                      textAlign: 'left',
                      font: 'inherit',
                      color: 'inherit',
                      cursor: 'pointer',
                      borderRadius: '0.375rem',
                      border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                      background: active ? 'var(--muted)' : 'transparent',
                    }}
                  >
                    <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>
                      {ticket.id} · {ticket.priority}
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{ticket.title}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="62" minSize="34">
          <div style={PANE} role="region" aria-label="Ticket detail" tabIndex={0}>
            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>
              {selected.id} · {selected.priority} priority · {selected.updated}
            </p>
            <p style={{ margin: '0.25rem 0 0.5rem', fontSize: '0.95rem', fontWeight: 600 }}>
              {selected.title}
            </p>
            <p className="fish-demo-muted" style={{ margin: '0 0 0.75rem' }}>
              Requested by {selected.requester}
            </p>
            <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.55 }}>{selected.body}</p>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      <p className="fish-demo-muted">
        Drag the divider, or focus it and use the arrow keys. Double-click resets the panel.
      </p>
    </div>
  )
}
