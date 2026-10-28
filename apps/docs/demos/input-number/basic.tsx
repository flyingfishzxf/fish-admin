import { useState } from 'react'

import { InputNumber, Label } from '@fish-admin/react'

export default function InputNumberBasic() {
  const [seats, setSeats] = useState<number | null>(12)
  const count = seats ?? 0

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-stack" style={{ gap: '0.4rem' }}>
        <Label htmlFor="demo-input-number-seats">Licensed seats</Label>
        <div style={{ width: '9rem' }}>
          <InputNumber
            id="demo-input-number-seats"
            aria-label="Licensed seats"
            value={seats}
            onValueChange={setSeats}
            min={1}
            max={50}
          />
        </div>
        <p className="fish-demo-muted" aria-live="polite" style={{ margin: 0 }}>
          {seats === null
            ? 'Enter a seat count between 1 and 50.'
            : `${count} seats × 12 AI credits = ${count * 12} credits per month.`}
        </p>
      </div>
      <p className="fish-demo-muted" style={{ margin: 0 }}>
        Type a value, click the steppers, or press ArrowUp and ArrowDown.
      </p>
    </div>
  )
}
