export interface DemoMember {
  id: string
  name: string
  team: 'engineering' | 'design' | 'product'
  status: 'active' | 'invited'
  joined: string
}

export const MEMBERS: DemoMember[] = [
  { id: 'm-1', name: 'Ada Lovelace', team: 'engineering', status: 'active', joined: '2025-01-12' },
  { id: 'm-2', name: 'Grace Hopper', team: 'engineering', status: 'active', joined: '2024-11-03' },
  { id: 'm-3', name: 'Alan Turing', team: 'product', status: 'invited', joined: '2025-06-21' },
  { id: 'm-4', name: 'Katherine Johnson', team: 'design', status: 'active', joined: '2025-03-18' },
  {
    id: 'm-5',
    name: 'Edsger Dijkstra',
    team: 'engineering',
    status: 'invited',
    joined: '2025-05-30',
  },
]
