import { useState } from 'react'

import { TreeSelect, type TreeItem } from '@fish-admin/react'

const ITEMS: TreeItem[] = [
  { id: 'engineering', parentId: null, label: 'Engineering' },
  { id: 'platform', parentId: 'engineering', label: 'Platform' },
  { id: 'frontend', parentId: 'engineering', label: 'Frontend' },
  { id: 'design', parentId: null, label: 'Design' },
  { id: 'product', parentId: null, label: 'Product' },
]

export default function TreeSelectBasic() {
  const [value, setValue] = useState<string | null>('frontend')

  return (
    <div className="fish-demo-stack">
      <p className="fish-demo-label" style={{ margin: 0 }}>
        Owning team
      </p>
      <TreeSelect
        items={ITEMS}
        value={value}
        onChange={setValue}
        onClear={() => setValue(null)}
        placeholder="Choose a team"
        ariaLabel="Owning team"
        clearLabel="Clear owning team"
        emptyLabel="No teams configured"
        className="fish-demo-w-72"
      />
      <p className="fish-demo-muted" aria-live="polite" style={{ margin: 0 }}>
        {value
          ? `Stored value is the node id "${value}"; the trigger shows its path, e.g. Engineering / Frontend.`
          : 'No team selected — the trigger is back to the placeholder.'}
      </p>
    </div>
  )
}
