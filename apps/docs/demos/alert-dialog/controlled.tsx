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
  Button,
} from '@fish-admin/react'

export default function AlertDialogControlled() {
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState('No decision yet.')

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-row">
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          Transfer ownership
        </Button>
        <p className="fish-demo-muted" role="status">
          {result}
        </p>
      </div>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Transfer to Ada?</AlertDialogTitle>
            <AlertDialogDescription>
              Ada becomes the workspace owner. You keep admin access but lose control of billing and
              member management.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setResult('Transfer cancelled. Ownership stays.')}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => setResult('Ownership transferred to Ada Lovelace.')}>
              Transfer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <p className="fish-demo-muted">
        The page owns the open state, so the result line updates from the same handlers that close
        the dialog.
      </p>
    </div>
  )
}
