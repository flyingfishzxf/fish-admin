import { useState } from 'react'

import { Slider } from '@fish-admin/react'

const WIDTH = 300

export default function SliderBasic() {
  const [budget, setBudget] = useState<number[]>([1800])
  const value = budget[0] ?? 0

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-row" style={{ justifyContent: 'space-between', width: WIDTH }}>
        <span className="fish-demo-label">Monthly infrastructure budget</span>
        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
          ${value.toLocaleString('en-US')}
        </span>
      </div>
      <div style={{ width: WIDTH }}>
        <Slider
          value={budget}
          onValueChange={setBudget}
          min={200}
          max={5000}
          step={100}
          thumbLabels={['Monthly infrastructure budget']}
        />
      </div>
      <p className="fish-demo-muted" style={{ margin: 0, maxWidth: WIDTH }}>
        Alerts fire at 80% of the selected budget. Steps of $100 between $200 and $5,000.
      </p>
      <p className="fish-demo-muted" style={{ margin: 0 }}>
        The slider is controlled: the readout above tracks the thumb while you drag or use the arrow
        keys.
      </p>
    </div>
  )
}
