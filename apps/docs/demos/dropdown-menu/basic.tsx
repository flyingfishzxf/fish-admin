import { useState } from 'react'

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@fish-admin/react'
import { Copy, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

export default function DropdownMenuBasic() {
  const [lastAction, setLastAction] = useState('No action chosen yet')

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-row">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal />
              Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" style={{ minWidth: '11rem' }}>
            <DropdownMenuItem onSelect={() => setLastAction('Edit')}>
              <Pencil />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setLastAction('Duplicate')}>
              <Copy />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => setLastAction('Delete')}>
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <span className="fish-demo-muted">Last action: {lastAction}</span>
      </div>
      <p className="fish-demo-muted">
        Open with Enter, Space or Arrow Down; Escape closes the menu and returns focus to the
        trigger.
      </p>
    </div>
  )
}
