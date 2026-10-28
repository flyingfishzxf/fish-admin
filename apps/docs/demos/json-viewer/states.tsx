import { JsonViewer } from '@fish-admin/react'

const ORG_SETTINGS = {
  org: {
    id: 'org_77',
    name: 'Fish Admin',
    plan: 'enterprise',
    seats: 240,
    sso: { provider: 'okta', enforced: true },
  },
}

export default function JsonViewerStates() {
  return (
    <div className="fish-demo-stack">
      <div style={{ display: 'grid', gap: '0.375rem' }}>
        <span className="fish-demo-label">Missing payload — undefined renders the empty state</span>
        <JsonViewer value={undefined} ariaLabel="Webhook payload" />
      </div>
      <div style={{ display: 'grid', gap: '0.375rem' }}>
        <span className="fish-demo-label">
          Collapsed on arrival — defaultExpandedDepth 0 keeps the root folded
        </span>
        <JsonViewer
          value={ORG_SETTINGS}
          ariaLabel="Organization settings"
          defaultExpandedDepth={0}
        />
      </div>
      <p className="fish-demo-muted">
        “No data” is the empty state, not an error; a null value would instead be drawn as{' '}
        <code>null</code>.
      </p>
    </div>
  )
}
