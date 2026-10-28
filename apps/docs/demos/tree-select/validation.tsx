import { useState } from 'react'

import { TreeSelect, type TreeItem } from '@fish-admin/react'

const REGIONS: TreeItem[] = [
  { id: 'eu', parentId: null, label: 'Europe' },
  { id: 'eu-central', parentId: 'eu', label: 'eu-central-1 (Frankfurt)' },
  { id: 'eu-west', parentId: 'eu', label: 'eu-west-1 (Ireland)' },
  { id: 'us', parentId: null, label: 'United States' },
  { id: 'us-east', parentId: 'us', label: 'us-east-1 (N. Virginia)' },
]

export default function TreeSelectValidation() {
  const [value, setValue] = useState<string | null>(null)
  const isMissing = value === null

  return (
    <div className="fish-demo-stack">
      <p className="fish-demo-label" style={{ margin: 0 }}>
        Deployment region (required)
      </p>
      <TreeSelect
        items={REGIONS}
        value={value}
        onChange={setValue}
        onClear={() => setValue(null)}
        placeholder="Choose a region"
        ariaLabel="Deployment region"
        clearLabel="Clear deployment region"
        aria-invalid={isMissing || undefined}
        aria-describedby={isMissing ? 'region-error' : undefined}
        className="fish-demo-w-72"
      />
      {isMissing ? (
        <p
          id="region-error"
          className="fish-demo-muted"
          style={{ color: 'var(--destructive)', margin: 0 }}
        >
          Select a deployment region before saving.
        </p>
      ) : (
        <p className="fish-demo-muted" style={{ margin: 0 }}>
          Region accepted: <code>{value}</code>.
        </p>
      )}
      <p className="fish-demo-label" style={{ margin: 0 }}>
        Failover region (locked by policy)
      </p>
      <TreeSelect
        items={REGIONS}
        value="us-east"
        onChange={() => {}}
        placeholder="Choose a region"
        ariaLabel="Failover region"
        disabled
        className="fish-demo-w-72"
      />
    </div>
  )
}
