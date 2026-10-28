import { useState } from 'react'

import { Button, Popconfirm } from '@fish-admin/react'
import { Trash2 } from 'lucide-react'

export default function PopconfirmBasic() {
  const [deleted, setDeleted] = useState(false)

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-row">
        <Popconfirm
          title="Delete this workflow?"
          description="Runs in progress are cancelled and the history is kept for 30 days."
          confirmLabel="Delete workflow"
          cancelLabel="Keep workflow"
          destructive
          onConfirm={() => setDeleted(true)}
        >
          <Button type="button" size="sm" variant="destructive">
            <Trash2 aria-hidden="true" />
            Delete workflow
          </Button>
        </Popconfirm>
        <p className="fish-demo-muted" role="status" style={{ margin: 0 }}>
          {deleted ? 'Workflow deleted.' : 'The workflow is still active.'}
        </p>
      </div>
      <p className="fish-demo-muted">
        Escape or “Keep workflow” closes the popover without deleting anything.
      </p>
    </div>
  )
}
