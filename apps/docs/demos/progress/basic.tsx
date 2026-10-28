import { useState } from 'react'

import { Button, Progress } from '@fish-admin/react'

const STEPS = ['Details', 'Team', 'Billing', 'Review']

export default function ProgressBasic() {
  const [step, setStep] = useState(2)
  const value = step * 25

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-row" style={{ justifyContent: 'space-between' }}>
        <span className="fish-demo-label" id="demo-progress-label">
          Onboarding progress
        </span>
        <span className="fish-demo-muted">{value}%</span>
      </div>
      <Progress value={value} aria-labelledby="demo-progress-label" />
      <div className="fish-demo-row">
        {STEPS.map((label, index) => (
          <Button
            key={label}
            type="button"
            variant={step >= index + 1 ? 'secondary' : 'outline'}
            size="xs"
            onClick={() => setStep(index + 1)}
          >
            {label}
          </Button>
        ))}
      </div>
      <p className="fish-demo-muted" aria-live="polite" style={{ margin: 0 }}>
        Step {step} of {STEPS.length} — {STEPS[step - 1]}.
      </p>
    </div>
  )
}
