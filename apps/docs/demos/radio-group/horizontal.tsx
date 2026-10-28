import { useState } from 'react'

import { Label, RadioGroup, RadioGroupItem } from '@fish-admin/react'

const CADENCES = [
  { value: 'daily', label: 'Daily', disabled: false },
  { value: 'weekly', label: 'Weekly', disabled: false },
  { value: 'monthly', label: 'Monthly', disabled: true },
]

export default function RadioGroupHorizontal() {
  const [cadence, setCadence] = useState('weekly')

  return (
    <div className="fish-demo-stack">
      <span id="demo-radio-cadence-label" className="fish-demo-label">
        Digest cadence
      </span>
      <RadioGroup
        value={cadence}
        onValueChange={setCadence}
        aria-labelledby="demo-radio-cadence-label"
        className="fish-demo-row"
        style={{ gap: '1.5rem' }}
      >
        {CADENCES.map((option) => (
          <div key={option.value} className="fish-demo-row" style={{ gap: '0.4rem' }}>
            <RadioGroupItem
              id={`demo-radio-cadence-${option.value}`}
              value={option.value}
              disabled={option.disabled}
              aria-describedby={option.disabled ? 'demo-radio-cadence-monthly-note' : undefined}
            />
            <Label
              htmlFor={`demo-radio-cadence-${option.value}`}
              style={option.disabled ? { opacity: 0.5 } : undefined}
            >
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
      <p id="demo-radio-cadence-monthly-note" className="fish-demo-muted">
        Monthly is disabled until the workspace has three months of history.
      </p>
      <p className="fish-demo-muted" aria-live="polite">
        Sending {cadence}.
      </p>
    </div>
  )
}
