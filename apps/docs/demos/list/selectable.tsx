import { useState } from 'react'

import { Avatar, AvatarFallback, Button, List, type ListItem } from '@fish-admin/react'
import { Ellipsis } from 'lucide-react'

type Member = {
  id: string
  name: string
  initials: string
  role: string
  meta: string
  disabled?: boolean
}

const MEMBERS: Member[] = [
  { id: 'ada', name: 'Ada Lovelace', initials: 'AL', role: 'Platform admin', meta: 'Active' },
  { id: 'grace', name: 'Grace Hopper', initials: 'GH', role: 'Auditor', meta: 'Invited' },
  {
    id: 'katherine',
    name: 'Katherine Johnson',
    initials: 'KJ',
    role: 'Billing owner',
    meta: 'Suspended',
    disabled: true,
  },
]

export default function ListSelectable() {
  const [selectedId, setSelectedId] = useState('ada')
  const [status, setStatus] = useState('Ada Lovelace is selected.')

  const items: ListItem[] = MEMBERS.map((member) => ({
    id: member.id,
    title: member.name,
    description: member.role,
    meta: member.meta,
    disabled: member.disabled,
    avatar: (
      <Avatar aria-hidden="true" style={{ width: 36, height: 36 }}>
        <AvatarFallback>{member.initials}</AvatarFallback>
      </Avatar>
    ),
    actions: (
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={`Open the row menu for ${member.name}`}
        onClick={() => setStatus(`Opened the row menu for ${member.name}.`)}
      >
        <Ellipsis aria-hidden="true" />
      </Button>
    ),
  }))

  return (
    <div className="fish-demo-stack">
      <List
        items={items}
        ariaLabel="Workspace members"
        emptyLabel="No members match this filter."
        selectedId={selectedId}
        onItemClick={(item) => {
          setSelectedId(item.id)
          setStatus(`${item.title} is selected.`)
        }}
      />
      <p className="fish-demo-muted" aria-live="polite">
        {status}
      </p>
      <p className="fish-demo-muted">
        The suspended member is disabled. Row menus sit outside the selection button, so opening one
        never changes the selection.
      </p>
    </div>
  )
}
