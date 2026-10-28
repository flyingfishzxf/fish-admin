import { useState } from 'react'

import { Button, Progress } from '@fish-admin/react'

const TASKS = [
  { label: 'Extract rows', value: 100, detail: '1,284 of 1,284 rows read' },
  { label: 'Normalise fields', value: 64, detail: '822 of 1,284 rows cleaned' },
  { label: 'Validate totals', value: 0, detail: 'Queued until normalisation ends' },
]

export default function ProgressValues() {
  const [processed, setProcessed] = useState(TASKS[1].value)

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-stack" style={{ gap: '1rem' }}>
        <div className="fish-demo-stack" style={{ gap: '0.35rem' }}>
          <div className="fish-demo-row" style={{ justifyContent: 'space-between' }}>
            <span className="fish-demo-label">{TASKS[0].label}</span>
            <span className="fish-demo-muted">{TASKS[0].value}%</span>
          </div>
          <Progress value={TASKS[0].value} aria-label={TASKS[0].label} />
          <p className="fish-demo-muted" style={{ margin: 0 }}>
            {TASKS[0].detail}
          </p>
        </div>

        <div className="fish-demo-stack" style={{ gap: '0.35rem' }}>
          <div className="fish-demo-row" style={{ justifyContent: 'space-between' }}>
            <span className="fish-demo-label">{TASKS[1].label}</span>
            <span className="fish-demo-muted">{processed}%</span>
          </div>
          <Progress value={processed} aria-label={TASKS[1].label} />
          <p className="fish-demo-muted" style={{ margin: 0 }}>
            {processed}% of rows cleaned; each click adds 12 points.
          </p>
        </div>

        <div className="fish-demo-stack" style={{ gap: '0.35rem' }}>
          <div className="fish-demo-row" style={{ justifyContent: 'space-between' }}>
            <span className="fish-demo-label">{TASKS[2].label}</span>
            <span className="fish-demo-muted">{TASKS[2].value}%</span>
          </div>
          <Progress value={TASKS[2].value} aria-label={TASKS[2].label} />
          <p className="fish-demo-muted" style={{ margin: 0 }}>
            {TASKS[2].detail}
          </p>
        </div>
      </div>

      <div className="fish-demo-row">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={processed === 100}
          onClick={() => setProcessed((current) => Math.min(100, current + 12))}
        >
          Advance normalisation
        </Button>
        <p className="fish-demo-muted" style={{ margin: 0 }}>
          A value of 0 renders an empty track; 100 fills it completely.
        </p>
      </div>
    </div>
  )
}
