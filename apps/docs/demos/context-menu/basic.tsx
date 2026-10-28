import { useState } from 'react'

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@fish-admin/react'
import { Archive, Copy, ExternalLink, FolderInput } from 'lucide-react'

export default function ContextMenuBasic() {
  const [lastAction, setLastAction] = useState('No action yet')

  return (
    <div className="fish-demo-stack" style={{ maxWidth: 420 }}>
      <p className="fish-demo-muted">
        Right-click the card — or long-press it on touch — to open its menu.
      </p>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '0.875rem 1rem',
              backgroundColor: 'var(--card)',
              cursor: 'context-menu',
            }}
          >
            <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>Apollo migration</p>
            <p className="fish-demo-muted" style={{ margin: '0.25rem 0 0' }}>
              Updated 2 hours ago · 8 members
            </p>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent style={{ width: 208 }}>
          <ContextMenuLabel>Apollo migration</ContextMenuLabel>
          <ContextMenuItem onSelect={() => setLastAction('Opened Apollo migration')}>
            <ExternalLink />
            Open project
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => setLastAction('Copied the project link')}>
            <Copy />
            Copy link
            <ContextMenuShortcut>⌘C</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => setLastAction('Duplicated Apollo migration')}>
            <FolderInput />
            Duplicate
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onSelect={() => setLastAction('Archived Apollo migration')}>
            <Archive />
            Archive
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <p className="fish-demo-muted">Last action: {lastAction}</p>
    </div>
  )
}
