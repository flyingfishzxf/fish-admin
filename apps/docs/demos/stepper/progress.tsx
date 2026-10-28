import { Stepper, type StepperStep } from '@fish-admin/react'

const STEPS: StepperStep[] = [
  { id: 'draft', title: 'Draft' },
  { id: 'review', title: 'Review' },
  { id: 'approved', title: 'Approved' },
  { id: 'published', title: 'Published' },
]

const STACK = { display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' } as const

export default function StepperProgress() {
  return (
    <div style={STACK}>
      <Stepper steps={STEPS} current={1} ariaLabel="Release approval progress" />
      <p className="fish-demo-muted">
        Without onStepClick every step is inert: Draft is complete and Review is current, but
        neither is a button. Use this form for a status readout rather than a wizard.
      </p>
    </div>
  )
}
