import { Watermark } from '@fish-admin/react'

const panelStyle = {
  minHeight: '7rem',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '1rem',
  background: 'var(--background)',
}

export default function WatermarkStyles() {
  return (
    <div className="fish-demo-stack">
      <div>
        <p className="fish-demo-label" style={{ margin: '0 0 0.25rem' }}>
          Default: opacity 0.08, rotate -20, gap 96
        </p>
        <Watermark text="DRAFT">
          <div style={panelStyle}>
            <p style={{ margin: 0 }}>Working copy of the budget forecast.</p>
          </div>
        </Watermark>
      </div>
      <div>
        <p className="fish-demo-label" style={{ margin: '0 0 0.25rem' }}>
          Bold: opacity 0.14, fontSize 22, rotate -35, gap 150
        </p>
        <Watermark text="CONFIDENTIAL" opacity={0.14} fontSize={22} rotate={-35} gap={150}>
          <div style={panelStyle}>
            <p style={{ margin: 0 }}>Board deck shared with the audit committee.</p>
          </div>
        </Watermark>
      </div>
      <div>
        <p className="fish-demo-label" style={{ margin: '0 0 0.25rem' }}>
          Dense tenant id: opacity 0.06, gap 60, no rotation
        </p>
        <Watermark text="acme-corp · user 4421" opacity={0.06} gap={60} rotate={0}>
          <div style={panelStyle}>
            <p style={{ margin: 0 }}>Support ticket thread visible to one tenant.</p>
          </div>
        </Watermark>
      </div>
    </div>
  )
}
