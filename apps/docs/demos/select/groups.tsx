import { useState } from 'react'

import {
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@fish-admin/react'

const PERMISSION_LABELS: Record<string, string> = {
  none: 'No access',
  read: 'Can view',
  write: 'Can edit',
  manage: 'Can manage',
}

export default function SelectGroups() {
  const [permission, setPermission] = useState('write')

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-stack" style={{ gap: '0.4rem' }}>
        <Label htmlFor="demo-select-groups-permission">Default permission</Label>
        <Select value={permission} onValueChange={setPermission}>
          <SelectTrigger id="demo-select-groups-permission" className="fish-demo-w-72">
            <SelectValue placeholder="Choose a permission" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Inherited from the folder</SelectLabel>
              <SelectItem value="none">No access</SelectItem>
              <SelectItem value="read">Can view</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Set explicitly</SelectLabel>
              <SelectItem value="write">Can edit</SelectItem>
              <SelectItem value="manage">Can manage</SelectItem>
              <SelectItem value="audit" disabled>
                Audit export — Enterprise only
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <p className="fish-demo-muted" aria-live="polite">
        New members get “{PERMISSION_LABELS[permission] ?? permission}” unless a folder overrides
        it.
      </p>

      <div className="fish-demo-stack" style={{ gap: '0.4rem' }}>
        <Label htmlFor="demo-select-groups-locked" style={{ opacity: 0.5 }}>
          Team default
        </Label>
        <Select value="team-default" disabled>
          <SelectTrigger id="demo-select-groups-locked" className="fish-demo-w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="team-default">Team default</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <p className="fish-demo-muted">
        The disabled select mirrors a value set by the team owner; there is nothing to change here.
      </p>
    </div>
  )
}
