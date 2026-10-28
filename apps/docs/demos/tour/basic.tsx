import { useMemo, useRef, useState } from 'react'

import { Button, Input, Tour, type TourLabels, type TourStep } from '@fish-admin/react'

const LABELS: TourLabels = {
  next: 'Next',
  previous: 'Back',
  skip: 'Skip tour',
  finish: 'Finish',
  step: (current, total) => `Step ${current} of ${total}`,
}

export default function TourBasic() {
  const nameRef = useRef<HTMLDivElement>(null)
  const planRef = useRef<HTMLDivElement>(null)
  const saveRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [finished, setFinished] = useState(false)

  const steps = useMemo<TourStep[]>(
    () => [
      {
        target: () => nameRef.current,
        title: 'Name your workspace',
        description: 'This is what teammates see in the switcher.',
        placement: 'bottom',
      },
      {
        target: () => planRef.current,
        title: 'Pick a plan',
        description: 'You can change plans later from billing.',
        placement: 'bottom',
      },
      {
        target: () => saveRef.current,
        title: 'Save and invite',
        description: 'Saving unlocks the invite flow.',
        placement: 'top',
      },
    ],
    [],
  )

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-row" style={{ justifyContent: 'space-between' }}>
        <p className="fish-demo-label" style={{ margin: 0 }}>
          Workspace setup
        </p>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
          Start tour
        </Button>
      </div>
      <div className="fish-demo-row" style={{ alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: '10rem' }}>
          <p className="fish-demo-label">Workspace name</p>
          <div ref={nameRef}>
            <Input aria-label="Workspace name" placeholder="Acme HQ" />
          </div>
        </div>
        <div style={{ flex: 1, minWidth: '10rem' }}>
          <p className="fish-demo-label">Plan</p>
          <div ref={planRef}>
            <select
              aria-label="Plan"
              defaultValue="team"
              style={{
                width: '100%',
                height: '2.25rem',
                padding: '0 0.5rem',
                fontSize: '0.875rem',
                color: 'var(--foreground)',
                background: 'var(--background)',
                border: '1px solid var(--input)',
                borderRadius: '0.375rem',
              }}
            >
              <option value="team">Team</option>
              <option value="business">Business</option>
            </select>
          </div>
        </div>
      </div>
      <div ref={saveRef} style={{ alignSelf: 'flex-start' }}>
        <Button type="button" size="sm" onClick={() => setFinished(true)}>
          Save workspace
        </Button>
      </div>
      <p className="fish-demo-muted" aria-live="polite">
        {finished
          ? 'Tour finished, workspace saved.'
          : 'Three spotlight steps anchored to the fields above.'}
      </p>
      <Tour
        steps={steps}
        open={open}
        onOpenChange={setOpen}
        onFinish={() => setFinished(true)}
        labels={LABELS}
      />
    </div>
  )
}
