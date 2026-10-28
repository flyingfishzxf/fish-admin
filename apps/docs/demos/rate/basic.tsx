import { useState } from 'react'

import { Rate } from '@fish-admin/react'

export default function RateBasic() {
  const [value, setValue] = useState(3)

  return (
    <div className="fish-demo-stack">
      <p className="fish-demo-label">How would you rate the onboarding call?</p>
      <div className="fish-demo-row">
        <Rate value={value} onChange={setValue} ariaLabel="Onboarding call rating" />
        <span className="fish-demo-muted" aria-live="polite">
          {value > 0 ? `${value} of 5 stars` : 'No rating yet'}
        </span>
      </div>
      <p className="fish-demo-muted">
        The score is owned by the page; Rate only reports the star that was picked.
      </p>
    </div>
  )
}
