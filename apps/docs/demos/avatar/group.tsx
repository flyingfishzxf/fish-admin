import { useState } from 'react'

import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, Button } from '@fish-admin/react'

const MEMBERS = [
  { id: 'ada', initials: 'AL', name: 'Ada Lovelace' },
  { id: 'grace', initials: 'GH', name: 'Grace Hopper' },
  { id: 'alan', initials: 'AT', name: 'Alan Turing' },
  { id: 'katherine', initials: 'KJ', name: 'Katherine Johnson' },
  { id: 'edsger', initials: 'ED', name: 'Edsger Dijkstra' },
  { id: 'margaret', initials: 'MH', name: 'Margaret Hamilton' },
  { id: 'barbara', initials: 'BL', name: 'Barbara Liskov' },
  { id: 'john', initials: 'JM', name: 'John McCarthy' },
  { id: 'radia', initials: 'RP', name: 'Radia Perlman' },
]

export default function AvatarGroupDemo() {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? MEMBERS : MEMBERS.slice(0, 4)
  const hidden = MEMBERS.length - visible.length

  return (
    <div className="fish-demo-stack">
      <AvatarGroup>
        {visible.map((member) => (
          <Avatar key={member.id} role="img" aria-label={member.name}>
            <AvatarFallback>{member.initials}</AvatarFallback>
          </Avatar>
        ))}
        {hidden > 0 ? (
          <AvatarGroupCount role="img" aria-label={`${hidden} more members`}>
            +{hidden}
          </AvatarGroupCount>
        ) : null}
      </AvatarGroup>
      <div className="fish-demo-row">
        <Button size="sm" variant="outline" onClick={() => setExpanded((current) => !current)}>
          {expanded ? 'Show fewer members' : `Show all ${MEMBERS.length} members`}
        </Button>
        <span className="fish-demo-muted">
          {expanded
            ? `All ${MEMBERS.length} avatars are rendered and the count is gone.`
            : 'Four avatars plus the overflow count; the count matches the avatar size.'}
        </span>
      </div>
    </div>
  )
}
