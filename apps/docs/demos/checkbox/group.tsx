import { useState } from 'react'

import { Checkbox, Label } from '@fish-admin/react'

const OPTIONS = [
  { id: 'weekly', label: 'Weekly digest', hint: 'Every Monday at 09:00, workspace time.' },
  { id: 'security', label: 'Security alerts', hint: 'New device sign-ins and revoked keys.' },
  { id: 'billing', label: 'Billing receipts', hint: 'Invoices, refunds and failed payments.' },
]

export default function CheckboxGroup() {
  const [selected, setSelected] = useState<string[]>(['security'])

  const toggle = (id: string, checked: boolean) => {
    setSelected((current) => (checked ? [...current, id] : current.filter((item) => item !== id)))
  }

  const selectedLabels = OPTIONS.filter((option) => selected.includes(option.id)).map(
    (option) => option.label,
  )

  return (
    <div className="fish-demo-stack">
      <div role="group" aria-labelledby="demo-checkbox-group-label" className="fish-demo-stack">
        <span id="demo-checkbox-group-label" className="fish-demo-label">
          Email notifications
        </span>
        {OPTIONS.map((option) => (
          <div key={option.id} className="fish-demo-row" style={{ alignItems: 'flex-start' }}>
            <Checkbox
              id={`demo-checkbox-group-${option.id}`}
              checked={selected.includes(option.id)}
              onCheckedChange={(checked) => toggle(option.id, checked === true)}
              aria-describedby={`demo-checkbox-group-${option.id}-hint`}
            />
            <div>
              <Label htmlFor={`demo-checkbox-group-${option.id}`}>{option.label}</Label>
              <p
                id={`demo-checkbox-group-${option.id}-hint`}
                className="fish-demo-muted"
                style={{ margin: '0.35rem 0 0' }}
              >
                {option.hint}
              </p>
            </div>
          </div>
        ))}
      </div>
      <p className="fish-demo-muted" aria-live="polite">
        {selected.length} of {OPTIONS.length} enabled
        {selected.length > 0 ? `: ${selectedLabels.join(', ')}` : '.'}
      </p>
    </div>
  )
}
