import { type CSSProperties } from 'react'

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@fish-admin/react'

const REQUEST_BODY = `{
  "event": "member.invited",
  "workspace": "acme-design",
  "email": "new.teammate@acme.dev"
}`

const RESPONSE_BODY = `{
  "id": "evt_8f31c2",
  "status": "queued",
  "attempt": 1,
  "deliveredAt": null
}`

const PANE: CSSProperties = { height: '100%', overflow: 'auto', padding: '0.75rem' }

const CODE: CSSProperties = {
  margin: 0,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: '0.72rem',
  lineHeight: 1.6,
  whiteSpace: 'pre-wrap',
}

export default function ResizableVertical() {
  return (
    <div className="fish-demo-stack" style={{ maxWidth: '40rem' }}>
      <ResizablePanelGroup
        orientation="vertical"
        style={{
          height: 280,
          border: '1px solid var(--border)',
          borderRadius: '0.5rem',
          overflow: 'hidden',
        }}
      >
        <ResizablePanel defaultSize="56" minSize="30">
          <div style={PANE} role="region" aria-label="Webhook request body" tabIndex={0}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', fontWeight: 600 }}>
              Request · POST /webhooks/members
            </p>
            <pre style={CODE}>{REQUEST_BODY}</pre>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="44" minSize="24">
          <div style={PANE} role="region" aria-label="Webhook response body" tabIndex={0}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', fontWeight: 600 }}>
              Response · <span style={{ color: 'var(--muted-foreground)' }}>202 Accepted</span>
            </p>
            <pre style={CODE}>{RESPONSE_BODY}</pre>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      <p className="fish-demo-muted">
        The vertical group stacks panels and swaps the cursor; the grip icon rotates 90 degrees.
      </p>
    </div>
  )
}
