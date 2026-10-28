import { useState } from 'react'

import { Button, Separator } from '@fish-admin/react'

export default function SeparatorBasic() {
  const [showPayment, setShowPayment] = useState(false)

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-row">
        <span className="fish-demo-label">Invoice</span>
        <span>INV-1042 · due November 3, 2026</span>
      </div>
      <Separator />
      <div className="fish-demo-row">
        <span className="fish-demo-label">Subtotal</span>
        <span>$1,240.00</span>
      </div>
      <div className="fish-demo-row">
        <span className="fish-demo-label">Tax</span>
        <span>$99.20</span>
      </div>
      <div className="fish-demo-row">
        <strong>Total</strong>
        <strong>$1,339.20</strong>
      </div>
      {showPayment ? (
        <>
          <Separator />
          <div className="fish-demo-row">
            <span className="fish-demo-label">Paid with</span>
            <span>Visa ending 4242</span>
          </div>
          <div className="fish-demo-row">
            <span className="fish-demo-label">Captured</span>
            <span>October 27, 2026</span>
          </div>
        </>
      ) : null}
      <Button size="sm" variant="ghost" onClick={() => setShowPayment((current) => !current)}>
        {showPayment ? 'Hide payment details' : 'Show payment details'}
      </Button>
      <p className="fish-demo-muted" style={{ margin: 0 }}>
        Both rules are decorative, so screen readers skip them; they only separate the sections
        visually.
      </p>
    </div>
  )
}
