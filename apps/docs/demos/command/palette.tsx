import { useState } from 'react'

import {
  Button,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@fish-admin/react'
import { FolderKanban, Plus, Search, UserPlus } from 'lucide-react'

const PROJECTS = ['Apollo migration', 'Atlas design system', 'Zephyr release']

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [lastRun, setLastRun] = useState('Nothing run yet')

  const run = (label: string) => {
    setLastRun(label)
    setOpen(false)
  }

  return (
    <div className="fish-demo-stack" style={{ maxWidth: 420 }}>
      <div className="fish-demo-row">
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Search />
          Open command palette
        </Button>
        <span className="fish-demo-muted">⌘K is bound in the template, not by the component</span>
      </div>
      <p className="fish-demo-muted">Last command: {lastRun}</p>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Command palette"
        description="Search projects and workspace actions."
      >
        <CommandInput placeholder="Search projects and actions…" />
        <CommandList>
          <CommandEmpty>Nothing matches that search.</CommandEmpty>
          <CommandGroup heading="Projects">
            {PROJECTS.map((project) => (
              <CommandItem key={project} onSelect={() => run(`Open ${project}`)}>
                <FolderKanban />
                {project}
                <CommandShortcut>↵</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => run('Create project')}>
              <Plus />
              Create project
              <CommandShortcut>C</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => run('Invite teammate')}>
              <UserPlus />
              Invite teammate
              <CommandShortcut>I</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  )
}
