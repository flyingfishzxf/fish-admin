import { useState } from 'react'

import { ColorPicker, Label } from '@fish-admin/react'

const SURFACE_PRESETS = ['#0f172a', '#1d4ed8', '#0d9488', '#b45309', '#be123c']

export default function ColorPickerPresets() {
  const [tint, setTint] = useState('#0d9488')

  return (
    <div className="fish-demo-stack" style={{ maxWidth: 420 }}>
      <div className="fish-demo-stack" style={{ gap: '0.4rem' }}>
        <Label htmlFor="demo-color-picker-tint">Surface tint</Label>
        <div style={{ width: '11rem' }}>
          <ColorPicker
            id="demo-color-picker-tint"
            value={tint}
            onValueChange={setTint}
            presets={SURFACE_PRESETS}
            ariaLabel="Surface tint"
            hexLabel="Surface tint hex"
            pickerLabel="Surface tint swatch"
            presetsLabel="Surface tint presets"
          />
        </div>
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '0.75rem 1rem',
            backgroundColor: `${tint}1f`,
          }}
        >
          <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>Weekly digest</p>
          <p className="fish-demo-muted" style={{ margin: '0.25rem 0 0' }}>
            Tinted with {tint.toUpperCase()} at 12% opacity.
          </p>
        </div>
        <p className="fish-demo-muted">
          Custom presets replace the eight defaults; <code>#abc</code> expands to{' '}
          <code>#aabbcc</code>.
        </p>
      </div>

      <div className="fish-demo-stack" style={{ gap: '0.4rem' }}>
        <span className="fish-demo-label">Workspace color</span>
        <div style={{ width: '11rem' }}>
          <ColorPicker defaultValue="#64748b" ariaLabel="Workspace color" disabled />
        </div>
        <p className="fish-demo-muted">
          Disabled: the trigger stays visible but the popover never opens.
        </p>
      </div>
    </div>
  )
}
