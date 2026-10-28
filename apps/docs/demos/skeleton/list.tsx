import { useState } from 'react'

import { Avatar, AvatarFallback, Badge, Button, Skeleton } from '@fish-admin/react'

const MEMBERS = [
  { id: 'ada', initials: 'AL', name: 'Ada Lovelace', email: 'ada@acme.dev', status: 'Active' },
  {
    id: 'grace',
    initials: 'GH',
    name: 'Grace Hopper',
    email: 'grace@acme.dev',
    status: 'Active',
  },
  { id: 'alan', initials: 'AT', name: 'Alan Turing', email: 'alan@acme.dev', status: 'Invited' },
  {
    id: 'katherine',
    initials: 'KJ',
    name: 'Katherine Johnson',
    email: 'katherine@acme.dev',
    status: 'Active',
  },
  {
    id: 'edsger',
    initials: 'ED',
    name: 'Edsger Dijkstra',
    email: 'edsger@acme.dev',
    status: 'Invited',
  },
] as const

export default function SkeletonList() {
  const [loading, setLoading] = useState(true)

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-row">
        <Button size="sm" variant="outline" onClick={() => setLoading((current) => !current)}>
          {loading ? 'Load members' : 'Show skeleton'}
        </Button>
        <span className="fish-demo-muted">
          {loading ? 'Loading 5 members…' : '5 members loaded.'}
        </span>
      </div>
      <div className="fish-demo-stack" style={{ gap: 12 }} aria-busy={loading}>
        {MEMBERS.map((member) => (
          <div key={member.id} className="fish-demo-row">
            {loading ? (
              <Skeleton style={{ width: 32, height: 32, borderRadius: 9999 }} />
            ) : (
              <Avatar role="img" aria-label={member.name}>
                <AvatarFallback>{member.initials}</AvatarFallback>
              </Avatar>
            )}
            <div className="fish-demo-stack" style={{ gap: 6, width: 160 }}>
              {loading ? (
                <>
                  <Skeleton style={{ height: 12, width: 120 }} />
                  <Skeleton style={{ height: 10, width: 88 }} />
                </>
              ) : (
                <>
                  <span>{member.name}</span>
                  <span className="fish-demo-muted">{member.email}</span>
                </>
              )}
            </div>
            {loading ? (
              <Skeleton style={{ width: 56, height: 20, borderRadius: 9999 }} />
            ) : (
              <Badge variant={member.status === 'Active' ? 'secondary' : 'outline'}>
                {member.status}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
