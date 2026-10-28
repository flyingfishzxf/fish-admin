import { useState } from 'react'

import { Button, LoadingOverlay, Spinner } from '@fish-admin/react'

export default function SpinnerLabeled() {
  const [loading, setLoading] = useState(false)

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-row">
        <Spinner label="Loading invoices" />
        <span className="fish-demo-label">
          Labeled spinner: a status region instead of aria-hidden
        </span>
      </div>
      <LoadingOverlay loading={loading} label="Refreshing quarterly report">
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '1rem',
          }}
        >
          <p style={{ margin: 0, fontWeight: 500 }}>Quarterly report</p>
          <p className="fish-demo-muted" style={{ margin: '0.25rem 0 0' }}>
            Updated 1 Oct 2026 · 24 pages
          </p>
        </div>
      </LoadingOverlay>
      <div className="fish-demo-row">
        <Button size="sm" variant="outline" onClick={() => setLoading((value) => !value)}>
          {loading ? 'Stop refreshing' : 'Refresh report'}
        </Button>
        <span className="fish-demo-muted">
          The overlay waits 150 ms before it covers the region.
        </span>
      </div>
    </div>
  )
}
