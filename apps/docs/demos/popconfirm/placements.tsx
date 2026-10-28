import { useState } from 'react'

import { Button, Popconfirm } from '@fish-admin/react'
import { Archive, KeyRound, Play } from 'lucide-react'

export default function PopconfirmPlacements() {
  const [status, setStatus] = useState('Nothing has changed yet.')

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-row">
        <Popconfirm
          side="right"
          title="Revoke the CI token?"
          description="Pipelines authenticating with this token fail on their next run."
          confirmLabel="Revoke token"
          destructive
          onConfirm={() => setStatus('CI token revoked; deploys are paused.')}
        >
          <Button type="button" size="sm" variant="destructive">
            <KeyRound aria-hidden="true" />
            Revoke token
          </Button>
        </Popconfirm>

        <Popconfirm
          side="bottom"
          align="start"
          title="Archive this workflow?"
          description="It stops running on schedule but keeps its run history."
          confirmLabel="Archive"
          cancelLabel="Leave active"
          onConfirm={() => setStatus('Workflow archived.')}
        >
          <Button type="button" size="sm" variant="outline">
            <Archive aria-hidden="true" />
            Archive workflow
          </Button>
        </Popconfirm>

        <Popconfirm
          side="top"
          align="end"
          title="Re-run the failed job?"
          description="The job starts again with the same commit and environment."
          confirmLabel="Re-run job"
          onConfirm={() => setStatus('Re-run queued; job 4812 restarts in a few seconds.')}
        >
          <Button type="button" size="sm" variant="outline">
            <Play aria-hidden="true" />
            Re-run job
          </Button>
        </Popconfirm>
      </div>
      <p className="fish-demo-muted" role="status">
        {status}
      </p>
      <p className="fish-demo-muted">
        side and align only set the preferred placement; the popover flips when there is no room.
      </p>
    </div>
  )
}
