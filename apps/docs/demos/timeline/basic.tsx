import { useMemo } from 'react'

import { CheckCircle2, KeyRound, ShieldCheck, UserPlus } from 'lucide-react'
import { Timeline, type TimelineItem } from '@fish-admin/react'

export default function TimelineBasic() {
  const items = useMemo<TimelineItem[]>(
    () => [
      {
        id: 'role',
        title: 'Role changed to Admin',
        description: 'Ada promoted Katherine in the Platform team.',
        timestamp: '2 hours ago',
        icon: ShieldCheck,
        tone: 'info',
      },
      {
        id: 'invite',
        title: 'Invitation accepted',
        description: 'Grace joined the Engineering team.',
        timestamp: 'Yesterday',
        icon: UserPlus,
        tone: 'success',
      },
      {
        id: 'key',
        title: 'API key created',
        description: 'deploy-bot was issued for the CI pipeline.',
        timestamp: '3 days ago',
        icon: KeyRound,
        tone: 'warning',
      },
      {
        id: 'login',
        title: 'New sign-in from Berlin',
        description: 'Chrome on macOS, IP 203.0.113.24.',
        timestamp: '5 days ago',
        icon: CheckCircle2,
      },
    ],
    [],
  )

  return (
    <div className="fish-demo-stack">
      <Timeline items={items} />
    </div>
  )
}
