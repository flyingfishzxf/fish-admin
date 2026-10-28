import { useState } from 'react'
import { Building2, GitBranch, Globe, Users } from 'lucide-react'

import { Tree, type TreeItem } from '@fish-admin/react'

const ITEMS: TreeItem[] = [
  { id: 'acme', parentId: null, label: 'Acme Corporation', icon: Building2 },
  { id: 'engineering', parentId: 'acme', label: 'Engineering', badge: '18', icon: GitBranch },
  { id: 'platform', parentId: 'engineering', label: 'Platform', badge: '7' },
  { id: 'web', parentId: 'engineering', label: 'Web', badge: '6' },
  { id: 'infra', parentId: 'engineering', label: 'Infrastructure', badge: '5' },
  { id: 'design', parentId: 'acme', label: 'Design', badge: '4', icon: Globe },
  { id: 'operations', parentId: 'acme', label: 'Operations', badge: '9', icon: Users },
  { id: 'retired', parentId: 'acme', label: 'Legacy CRM', disabled: true },
]

export default function TreeBasic() {
  const [selectedId, setSelectedId] = useState<string | null>('platform')
  const selected = ITEMS.find((item) => item.id === selectedId)

  return (
    <div className="fish-demo-stack">
      <p className="fish-demo-muted" style={{ margin: 0 }}>
        Focus a row, then use arrow keys to walk the hierarchy; Enter or Space selects it.
      </p>
      <div
        role="presentation"
        style={{
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          background: 'var(--card)',
          padding: '0.5rem',
        }}
      >
        <Tree
          items={ITEMS}
          selectedId={selectedId}
          onSelect={setSelectedId}
          ariaLabel="Organization structure"
          emptyLabel="No departments configured"
        />
      </div>
      <p className="fish-demo-muted" aria-live="polite" style={{ margin: 0 }}>
        {selected ? `Selected department: ${selected.label}.` : 'No department selected.'}
      </p>
    </div>
  )
}
