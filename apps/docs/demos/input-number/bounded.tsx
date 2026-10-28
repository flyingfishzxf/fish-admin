import { useState } from 'react'

import { InputNumber, Label } from '@fish-admin/react'

export default function InputNumberBounded() {
  const [seats, setSeats] = useState<number | null>(4)
  const [storage, setStorage] = useState<number | null>(1.5)
  const seatCount = seats ?? 0
  const storageCount = storage ?? 0
  const total = seatCount * 12 + storageCount * 4

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-stack" style={{ gap: '0.4rem' }}>
        <Label htmlFor="demo-input-number-bounded-seats">Seats (1–10, step 1)</Label>
        <div style={{ width: '9rem' }}>
          <InputNumber
            id="demo-input-number-bounded-seats"
            aria-label="Seats"
            value={seats}
            onValueChange={setSeats}
            min={1}
            max={10}
          />
        </div>
      </div>

      <div className="fish-demo-stack" style={{ gap: '0.4rem' }}>
        <Label htmlFor="demo-input-number-bounded-storage">Extra storage (0–5 GB, step 0.5)</Label>
        <div style={{ width: '9rem' }}>
          <InputNumber
            id="demo-input-number-bounded-storage"
            aria-label="Extra storage in gigabytes"
            value={storage}
            onValueChange={setStorage}
            min={0}
            max={5}
            step={0.5}
            precision={1}
          />
        </div>
      </div>

      <p className="fish-demo-muted" aria-live="polite" style={{ margin: 0 }}>
        {`$${total.toFixed(2)} per month: ${seatCount} × $12 plus ${storageCount.toFixed(1)} GB × $4.`}
      </p>
      <p className="fish-demo-muted" style={{ margin: 0 }}>
        Both steppers disable at their bounds; typed values clamp and reformat on blur.
      </p>
    </div>
  )
}
