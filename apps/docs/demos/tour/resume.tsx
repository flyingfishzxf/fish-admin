import { useMemo, useRef, useState } from 'react'

import { Button, Input, Tour, type TourLabels, type TourStep } from '@fish-admin/react'

const LABELS: TourLabels = {
  next: 'Next',
  previous: 'Back',
  skip: 'Skip',
  finish: 'Done',
  step: (current, total) => `${current} / ${total}`,
}

export default function TourResume() {
  const retentionRef = useRef<HTMLDivElement>(null)
  const applyRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [completed, setCompleted] = useState(false)

  const steps = useMemo<TourStep[]>(
    () => [
      {
        target: () => retentionRef.current,
        title: 'Set the retention window',
        description: 'Days of audit logs to keep. Range is 7 to 365.',
        placement: 'bottom',
      },
      {
        target: () => applyRef.current,
        title: 'Apply across workspaces',
        description: 'Pushes the setting to every workspace you own.',
        placement: 'top',
      },
    ],
    [],
  )

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-row" style={{ justifyContent: 'space-between' }}>
        <p className="fish-demo-label" style={{ margin: 0 }}>
          Audit retention
        </p>
        {!completed ? (
          <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
            Guided setup
          </Button>
        ) : (
          <p className="fish-demo-muted" style={{ margin: 0 }}>
            Setup completed.
          </p>
        )}
      </div>
      <div className="fish-demo-row" style={{ alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: '10rem' }} ref={retentionRef}>
          <p className="fish-demo-label">Retention days</p>
          <Input type="number" aria-label="Retention days" defaultValue={90} min={7} max={365} />
        </div>
        <div ref={applyRef} style={{ alignSelf: 'flex-end' }}>
          <Button type="button" size="sm" onClick={() => setCompleted(true)}>
            Apply
          </Button>
        </div>
      </div>
      <p className="fish-demo-muted" aria-live="polite">
        {completed
          ? 'The tour is dismissed and will not offer to reopen.'
          : 'Finishing the tour calls onFinish and hides the launcher.'}
      </p>
      <Tour
        steps={steps}
        open={open}
        onOpenChange={setOpen}
        onFinish={() => setCompleted(true)}
        labels={LABELS}
      />
    </div>
  )
}
