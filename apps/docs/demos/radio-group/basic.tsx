import { useState } from 'react'

import { Label, RadioGroup, RadioGroupItem } from '@fish-admin/react'

const PLANS = [
  { value: 'starter', label: 'Starter', hint: 'Up to 3 members, community support.' },
  { value: 'team', label: 'Team', hint: '$12 per seat, audit log export.' },
  { value: 'enterprise', label: 'Enterprise', hint: 'SSO, scoped roles, priority SLA.' },
]

export default function RadioGroupBasic() {
  const [plan, setPlan] = useState('team')
  const current = PLANS.find((option) => option.value === plan)

  return (
    <div className="fish-demo-stack">
      <span id="demo-radio-plan-label" className="fish-demo-label">
        Billing plan
      </span>
      <RadioGroup value={plan} onValueChange={setPlan} aria-labelledby="demo-radio-plan-label">
        {PLANS.map((option) => (
          <div key={option.value} className="fish-demo-row" style={{ alignItems: 'flex-start' }}>
            <RadioGroupItem
              id={`demo-radio-plan-${option.value}`}
              value={option.value}
              aria-describedby={`demo-radio-plan-${option.value}-hint`}
              style={{ marginTop: '0.15rem' }}
            />
            <div>
              <Label htmlFor={`demo-radio-plan-${option.value}`}>{option.label}</Label>
              <p
                id={`demo-radio-plan-${option.value}-hint`}
                className="fish-demo-muted"
                style={{ margin: '0.35rem 0 0' }}
              >
                {option.hint}
              </p>
            </div>
          </div>
        ))}
      </RadioGroup>
      <p className="fish-demo-muted" aria-live="polite">
        {current ? `${current.label} selected — ${current.hint}` : 'No plan selected.'}
      </p>
    </div>
  )
}
