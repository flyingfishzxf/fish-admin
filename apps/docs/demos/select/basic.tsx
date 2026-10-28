import { useState } from 'react'

import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@fish-admin/react'

const ROLES = [
  { value: 'owner', label: 'Owner', scope: 'Full access, including billing.' },
  { value: 'admin', label: 'Admin', scope: 'Manage members, projects and integrations.' },
  { value: 'member', label: 'Member', scope: 'Work on projects, no workspace settings.' },
  { value: 'viewer', label: 'Viewer', scope: 'Read-only access to shared projects.' },
]

export default function SelectBasic() {
  const [role, setRole] = useState('admin')
  const current = ROLES.find((option) => option.value === role)

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-stack" style={{ gap: '0.4rem' }}>
        <Label htmlFor="demo-select-role">Assign role</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger id="demo-select-role" className="fish-demo-w-72">
            <SelectValue placeholder="Choose a role" />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p className="fish-demo-muted" aria-live="polite">
        {current ? `${current.label}: ${current.scope}` : 'No role selected.'}
      </p>
    </div>
  )
}
