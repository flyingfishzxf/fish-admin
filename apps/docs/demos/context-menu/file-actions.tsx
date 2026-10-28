import { useState } from 'react'

import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@fish-admin/react'
import {
  Download,
  Eye,
  FileText,
  FolderClosed,
  FolderInput,
  Pencil,
  Star,
  Trash2,
} from 'lucide-react'

const FILES = [
  { name: 'Q3-roadmap.pdf', meta: '2.4 MB · Product' },
  { name: 'design-system.fig', meta: '18.1 MB · Design' },
]

const FOLDERS = ['Product', 'Design', 'Archive']

export default function ContextMenuFileActions() {
  const [pinned, setPinned] = useState<string[]>([])
  const [status, setStatus] = useState('No action yet')

  const togglePinned = (name: string, checked: boolean) => {
    setPinned((previous) =>
      checked ? [...previous, name] : previous.filter((entry) => entry !== name),
    )
    setStatus(`${checked ? 'Pinned' : 'Unpinned'} ${name}`)
  }

  return (
    <div className="fish-demo-stack" style={{ maxWidth: 460 }}>
      <p className="fish-demo-muted">
        Right-click a file row to open its menu: two actions, a Move to submenu, a pin toggle and a
        disabled Delete.
      </p>
      <div className="fish-demo-stack" style={{ gap: '0.5rem' }}>
        {FILES.map((file) => (
          <ContextMenu key={file.name}>
            <ContextMenuTrigger asChild>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.625rem',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  backgroundColor: 'var(--background)',
                  cursor: 'context-menu',
                }}
              >
                <FileText
                  aria-hidden
                  style={{ width: 16, height: 16, color: 'var(--muted-foreground)' }}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>{file.name}</p>
                  <p className="fish-demo-muted" style={{ margin: 0 }}>
                    {file.meta}
                  </p>
                </div>
                {pinned.includes(file.name) ? (
                  <Star
                    aria-hidden
                    style={{ width: 14, height: 14, color: 'var(--muted-foreground)' }}
                  />
                ) : null}
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent style={{ width: 208 }}>
              <ContextMenuLabel>{file.name}</ContextMenuLabel>
              <ContextMenuItem onSelect={() => setStatus(`Opened ${file.name}`)}>
                <Eye />
                Open
              </ContextMenuItem>
              <ContextMenuItem onSelect={() => setStatus(`Downloaded ${file.name}`)}>
                <Download />
                Download
              </ContextMenuItem>
              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  <FolderInput />
                  Move to
                </ContextMenuSubTrigger>
                <ContextMenuSubContent>
                  {FOLDERS.map((folder) => (
                    <ContextMenuItem
                      key={folder}
                      onSelect={() => setStatus(`Moved ${file.name} to ${folder}`)}
                    >
                      <FolderClosed />
                      {folder}
                    </ContextMenuItem>
                  ))}
                </ContextMenuSubContent>
              </ContextMenuSub>
              <ContextMenuSeparator />
              <ContextMenuCheckboxItem
                checked={pinned.includes(file.name)}
                onCheckedChange={(checked) => togglePinned(file.name, checked === true)}
              >
                Pin to favorites
              </ContextMenuCheckboxItem>
              <ContextMenuItem onSelect={() => setStatus(`Renaming ${file.name}`)}>
                <Pencil />
                Rename
                <ContextMenuShortcut>F2</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem disabled>
                <Trash2 />
                Delete
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </div>
      <p className="fish-demo-muted">
        Delete stays disabled because this account is not the file owner. Last action: {status}.
      </p>
    </div>
  )
}
