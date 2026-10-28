import { useMemo, useState } from 'react'

import { Button, Tree, type TreeItem } from '@fish-admin/react'

const ITEMS: TreeItem[] = [
  { id: 'eu-central', parentId: null, label: 'eu-central-1', description: 'Frankfurt, primary' },
  { id: 'eu-db', parentId: 'eu-central', label: 'Databases', badge: '12' },
  { id: 'eu-cache', parentId: 'eu-central', label: 'Cache clusters', badge: '4' },
  { id: 'us-east', parentId: null, label: 'us-east-1', description: 'N. Virginia, DR' },
  { id: 'us-db', parentId: 'us-east', label: 'Databases', badge: '3' },
  { id: 'us-legacy', parentId: 'us-east', label: 'Legacy instances', badge: '2' },
  { id: 'ap-south', parentId: null, label: 'ap-south-1', description: 'Mumbai, edge' },
]

export default function TreeExpanded() {
  const parentIds = useMemo(
    () =>
      ITEMS.filter((item) => ITEMS.some((child) => child.parentId === item.id)).map((i) => i.id),
    [],
  )
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(new Set(['eu-central']))
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-row">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setExpandedIds(new Set(parentIds))}
        >
          Expand all
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setExpandedIds(new Set())}>
          Collapse all
        </Button>
      </div>
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
          expandedIds={expandedIds}
          onExpandedChange={setExpandedIds}
          ariaLabel="Datacenter regions"
        />
      </div>
      <p className="fish-demo-muted" aria-live="polite" style={{ margin: 0 }}>
        {`${expandedIds.size} of ${parentIds.length} branches open`}
        {selectedId ? ` · focused node: ${selectedId}` : ''}. With `expandedIds` provided the tree
        stops expanding on its own, so <code>onExpandedChange</code> is the only way to update the
        set.
      </p>
    </div>
  )
}
