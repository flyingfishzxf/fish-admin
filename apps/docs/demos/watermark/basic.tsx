import { Watermark } from '@fish-admin/react'

export default function WatermarkBasic() {
  return (
    <div className="fish-demo-stack">
      <Watermark text="CONFIDENTIAL">
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '1rem',
            background: 'var(--background)',
          }}
        >
          <p style={{ margin: 0, fontWeight: 600 }}>Payroll export — Q4 2026</p>
          <p className="fish-demo-muted" style={{ margin: '0.25rem 0 0' }}>
            48 rows · contains employee identifiers and gross pay
          </p>
          <p className="fish-demo-muted" style={{ margin: '0.75rem 0 0' }}>
            Marked confidential for internal distribution only.
          </p>
        </div>
      </Watermark>
      <p className="fish-demo-muted" style={{ margin: 0 }}>
        The repeated "CONFIDENTIAL" text is a decorative <code>aria-hidden</code> canvas layer. The
        real confidentiality note lives in the readable paragraph above it, so the label is never
        the only copy of that information.
      </p>
    </div>
  )
}
