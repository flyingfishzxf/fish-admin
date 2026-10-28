import { useState } from 'react'

import { Segmented } from '@fish-admin/react'
import { FileSpreadsheet, Users } from 'lucide-react'

export default function SegmentedBasic() {
  const [view, setView] = useState('members')

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-row" style={{ justifyContent: 'space-between' }}>
        <span className="fish-demo-label">Workspace</span>
        <Segmented
          aria-label="Workspace view"
          value={view}
          onValueChange={setView}
          options={[
            { value: 'members', label: 'Members', icon: Users },
            { value: 'invoices', label: 'Invoices', icon: FileSpreadsheet },
          ]}
        />
      </div>
      <p className="fish-demo-muted" aria-live="polite">
        {view === 'members'
          ? 'Showing 12 members, 2 with pending invitations.'
          : 'Showing 4 invoices, the latest one still open.'}
      </p>
    </div>
  )
}
