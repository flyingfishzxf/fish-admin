import { Spinner } from '@fish-admin/react'

export default function SpinnerBasic() {
  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-row">
        <Spinner size="sm" />
        <span className="fish-demo-label">sm — 14 px, for buttons and dense rows</span>
      </div>
      <div className="fish-demo-row">
        <Spinner />
        <span className="fish-demo-label">default — 16 px, for cards and panels</span>
      </div>
      <div className="fish-demo-row">
        <Spinner size="lg" />
        <span className="fish-demo-label">lg — 24 px, for a first full-panel load</span>
      </div>
    </div>
  )
}
