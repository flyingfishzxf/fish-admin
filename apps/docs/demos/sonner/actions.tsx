import { Button, Toaster } from '@fish-admin/react'
import { toast } from 'sonner'

const TOASTER_ID = 'docs-sonner-actions'

export default function SonnerActions() {
  return (
    <>
      <div className="fish-demo-stack">
        <div className="fish-demo-row">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast('Archived “Q3 launch plan”', {
                toasterId: TOASTER_ID,
                description: 'The board is hidden from members.',
                duration: 8000,
                action: {
                  label: 'Undo',
                  onClick: () => toast.success('Project restored', { toasterId: TOASTER_ID }),
                },
              })
            }
          >
            Archive project
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast.error('Deploy failed', {
                toasterId: TOASTER_ID,
                description: 'Build 1284 exited with code 1.',
                duration: 8000,
                action: {
                  label: 'Retry',
                  onClick: () =>
                    toast.success('Build 1284 queued again', { toasterId: TOASTER_ID }),
                },
              })
            }
          >
            Deploy
          </Button>
        </div>
        <p className="fish-demo-muted" style={{ margin: 0 }}>
          Both toasts pass <code>duration: 8000</code> so the action stays reachable twice as long
          as the 4 s default. Clicking the action dismisses the toast and fires a second one.
        </p>
        <p className="fish-demo-muted" style={{ margin: 0 }}>
          An action is a plain label plus a handler; sonner renders it as a button inside the toast,
          which is portaled to the bottom right of the viewport.
        </p>
      </div>
      <Toaster id={TOASTER_ID} customAriaLabel="Actionable notifications" />
    </>
  )
}
