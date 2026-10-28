import { useState } from 'react'

import { Rate } from '@fish-admin/react'

export default function RateStates() {
  const [value, setValue] = useState(4)

  return (
    <div className="fish-demo-stack">
      <div>
        <p className="fish-demo-label">Editable: click the fourth star again to clear it.</p>
        <div className="fish-demo-row">
          <Rate value={value} onChange={setValue} ariaLabel="Editable quality rating" />
          <span className="fish-demo-muted" aria-live="polite">
            {value > 0 ? `${value} of 5 stars` : 'Not rated'}
          </span>
        </div>
      </div>
      <div>
        <p className="fish-demo-label">Read-only: average of 128 review scores.</p>
        <div className="fish-demo-row">
          <Rate value={4} readOnly ariaLabel="Average quality rating" />
          <span className="fish-demo-muted">4.0 out of 5</span>
        </div>
      </div>
    </div>
  )
}
