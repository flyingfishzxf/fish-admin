import { List, type ListItem } from '@fish-admin/react'
import { FileUp, Rocket, ShieldCheck } from 'lucide-react'

const ACTIVITY: ListItem[] = [
  {
    id: 'deploy',
    title: 'Production deploy finished',
    description: 'Build 4812 · 42 seconds',
    meta: '2m ago',
    icon: Rocket,
  },
  {
    id: 'review',
    title: 'Access review completed',
    description: '12 of 240 role assignments changed',
    meta: '1h ago',
    icon: ShieldCheck,
  },
  {
    id: 'export',
    title: 'Invoice batch exported',
    description: 'September · 248 invoices',
    meta: 'Yesterday',
    icon: FileUp,
  },
]

export default function ListBasic() {
  return (
    <div className="fish-demo-stack">
      <List items={ACTIVITY} ariaLabel="Workspace activity" emptyLabel="No activity yet." />
      <p className="fish-demo-muted">
        Without onItemClick the rows are plain text: no hover, no focus, no selection.
      </p>
    </div>
  )
}
