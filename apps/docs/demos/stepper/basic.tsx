import { useState } from 'react'

import { Button, Stepper, type StepperStep } from '@fish-admin/react'

const STEPS: StepperStep[] = [
  { id: 'workspace', title: 'Workspace', description: 'Name the workspace and pick a region.' },
  { id: 'billing', title: 'Billing', description: 'Choose a plan and add a payment method.' },
  { id: 'members', title: 'Members', description: 'Invite the first teammates.' },
  { id: 'review', title: 'Review', description: 'Confirm the details and finish.' },
]

const STACK = { display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' } as const

export default function StepperBasic() {
  const [current, setCurrent] = useState(1)

  return (
    <div style={STACK}>
      <Stepper
        steps={STEPS}
        current={current}
        onStepClick={setCurrent}
        ariaLabel="Workspace setup steps"
      />
      <div className="fish-demo-row">
        <Button
          variant="outline"
          size="sm"
          disabled={current === 0}
          onClick={() => setCurrent((value) => Math.max(0, value - 1))}
        >
          Back
        </Button>
        <Button
          size="sm"
          disabled={current === STEPS.length - 1}
          onClick={() => setCurrent((value) => Math.min(STEPS.length - 1, value + 1))}
        >
          Next
        </Button>
        <span className="fish-demo-muted" aria-live="polite">
          Step {current + 1} of {STEPS.length}
        </span>
      </div>
      <p className="fish-demo-muted">
        Completed steps are buttons as well; steps after the current one stay inert.
      </p>
    </div>
  )
}
