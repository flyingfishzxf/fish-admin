import { useState } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from '@fish-admin/react'
import { KeyRound } from 'lucide-react'

export default function AlertDialogBasic() {
  const [revoked, setRevoked] = useState(false)

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-row">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <KeyRound aria-hidden="true" style={{ width: '1rem', height: '1rem' }} />
              Revoke API key
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke the CI deploy key?</AlertDialogTitle>
              <AlertDialogDescription>
                Pipelines that authenticate with this key start failing on their next run. A new key
                must be issued before deploys can resume.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep key</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={() => setRevoked(true)}>
                Revoke key
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <p className="fish-demo-muted" role="status">
          {revoked ? 'CI deploy key revoked.' : 'The key is still active.'}
        </p>
      </div>
      <p className="fish-demo-muted">
        Escape or “Keep key” closes the dialog without changing anything.
      </p>
    </div>
  )
}
