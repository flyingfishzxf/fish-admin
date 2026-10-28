import { useState } from 'react'

import { Slider } from '@fish-admin/react'

const WIDTH = 300

export default function SliderRange() {
  const [price, setPrice] = useState<number[]>([120, 480])
  const [discount, setDiscount] = useState<number[]>([25])

  return (
    <div className="fish-demo-stack">
      <div>
        <div className="fish-demo-row" style={{ justifyContent: 'space-between', width: WIDTH }}>
          <span className="fish-demo-label">Price range</span>
          <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
            {`$${price[0] ?? 0} – $${price[1] ?? 0}`}
          </span>
        </div>
        <div style={{ width: WIDTH, marginTop: '0.5rem' }}>
          <Slider
            value={price}
            onValueChange={setPrice}
            min={0}
            max={1000}
            step={10}
            thumbLabels={['Minimum price', 'Maximum price']}
          />
        </div>
        <p className="fish-demo-muted" style={{ margin: '0.5rem 0 0' }}>
          One thumb per value: the array has two entries, so two thumbs share a single track.
        </p>
      </div>

      <div>
        <div className="fish-demo-row" style={{ justifyContent: 'space-between', width: WIDTH }}>
          <span className="fish-demo-label">Team discount</span>
          <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
            {`${discount[0] ?? 0}%`}
          </span>
        </div>
        <div style={{ width: WIDTH, marginTop: '0.5rem' }}>
          <Slider
            value={discount}
            onValueChange={setDiscount}
            min={0}
            max={100}
            step={25}
            thumbLabels={['Team discount']}
          />
        </div>
        <p className="fish-demo-muted" style={{ margin: '0.5rem 0 0' }}>
          <code>step=25</code> snaps the value to 0, 25, 50, 75 or 100 — every arrow-key press moves
          one step.
        </p>
      </div>
    </div>
  )
}
