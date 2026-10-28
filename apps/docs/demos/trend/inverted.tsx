import { Trend } from '@fish-admin/react'

export default function TrendInverted() {
  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-row" style={{ justifyContent: 'space-between' }}>
        <span className="fish-demo-label">Cost per order</span>
        <Trend value={-0.6} label="vs last month" invert />
      </div>
      <div className="fish-demo-row" style={{ justifyContent: 'space-between' }}>
        <span className="fish-demo-label">Bounce rate</span>
        <Trend value={-1.25} label="vs last month" suffix=" pt" precision={2} invert />
      </div>
      <div className="fish-demo-row" style={{ justifyContent: 'space-between' }}>
        <span className="fish-demo-label">Failed logins</span>
        <Trend value={4.2} label="vs last month" invert />
      </div>
      <p className="fish-demo-muted" style={{ margin: 0 }}>
        With <code>invert</code>, the arrow still follows the sign, but the tone flips: churn
        dropping 0.6% reads as a success, while failed logins rising 4.2% turns destructive. Bounce
        rate prints <code>-1.25 pt</code> thanks to <code>suffix</code> and <code>precision</code>.
      </p>
    </div>
  )
}
