import { useState } from 'react'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@fish-admin/react'
import { Download, KeyRound, Settings2, UserPlus } from 'lucide-react'

export default function CommandBasic() {
  const [lastRun, setLastRun] = useState('Nothing run yet')

  return (
    <div className="fish-demo-stack" style={{ maxWidth: 420 }}>
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <Command>
          <CommandInput placeholder="Type a command or search…" />
          <CommandList>
            <CommandEmpty>No commands match that search.</CommandEmpty>
            <CommandGroup heading="Workspace">
              <CommandItem onSelect={() => setLastRun('Invite teammate')}>
                <UserPlus />
                Invite teammate
                <CommandShortcut>⌘I</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => setLastRun('Export members to CSV')}>
                <Download />
                Export members to CSV
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Account">
              <CommandItem onSelect={() => setLastRun('Manage API keys')}>
                <KeyRound />
                Manage API keys
              </CommandItem>
              <CommandItem onSelect={() => setLastRun('Workspace settings')}>
                <Settings2 />
                Workspace settings
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
      <p className="fish-demo-muted">
        Type to filter, use ↑ ↓ to move and Enter to run. Last command: {lastRun}.
      </p>
    </div>
  )
}
