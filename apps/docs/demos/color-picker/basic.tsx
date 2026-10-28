import { useState } from 'react'

import { ColorPicker, Label } from '@fish-admin/react'

export default function ColorPickerBasic() {
  const [color, setColor] = useState('#6366f1')

  return (
    <div className="fish-demo-stack" style={{ maxWidth: 420 }}>
      <div className="fish-demo-stack" style={{ gap: '0.4rem' }}>
        <Label htmlFor="demo-color-picker-brand">Brand color</Label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '11rem', flexShrink: 0 }}>
            <ColorPicker
              id="demo-color-picker-brand"
              value={color}
              onValueChange={setColor}
              ariaLabel="Brand color"
              hexLabel="Brand color hex"
              pickerLabel="Brand color swatch"
              presetsLabel="Brand color presets"
            />
          </div>
          <div
            aria-hidden
            style={{
              flex: 1,
              minWidth: 96,
              height: 36,
              borderRadius: 6,
              border: '1px solid var(--border)',
              backgroundColor: color,
            }}
          />
        </div>
        <p className="fish-demo-muted">
          Brand color: {color.toUpperCase()} — open the trigger to pick a preset or type a hex
          value.
        </p>
      </div>
    </div>
  )
}
