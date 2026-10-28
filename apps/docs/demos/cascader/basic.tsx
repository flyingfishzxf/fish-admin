import { useState } from 'react'

import { Cascader, type CascaderOption } from '@fish-admin/react'

const OPTIONS: CascaderOption[] = [
  {
    value: 'americas',
    label: 'Americas',
    children: [
      {
        value: 'us',
        label: 'United States',
        children: [
          { value: 'california', label: 'California' },
          { value: 'new-york', label: 'New York' },
          { value: 'texas', label: 'Texas' },
        ],
      },
      {
        value: 'canada',
        label: 'Canada',
        children: [
          { value: 'ontario', label: 'Ontario' },
          { value: 'quebec', label: 'Quebec' },
        ],
      },
    ],
  },
  {
    value: 'europe',
    label: 'Europe',
    children: [
      {
        value: 'germany',
        label: 'Germany',
        children: [
          { value: 'berlin', label: 'Berlin' },
          { value: 'bavaria', label: 'Bavaria' },
        ],
      },
      {
        value: 'france',
        label: 'France',
        children: [{ value: 'paris', label: 'Paris' }],
      },
    ],
  },
  {
    value: 'apac',
    label: 'Asia Pacific',
    children: [
      {
        value: 'japan',
        label: 'Japan',
        children: [{ value: 'tokyo', label: 'Tokyo' }],
      },
      {
        value: 'singapore',
        label: 'Singapore',
        children: [{ value: 'central', label: 'Central' }],
      },
    ],
  },
]

export default function CascaderBasic() {
  const [value, setValue] = useState<string[]>([])

  return (
    <div className="fish-demo-stack">
      <p className="fish-demo-label">Office location</p>
      <div className="fish-demo-w-72">
        <Cascader
          options={OPTIONS}
          value={value}
          onChange={setValue}
          onClear={() => setValue([])}
          placeholder="Select a region, country and office"
          ariaLabel="Office location"
          clearLabel="Clear office location"
          emptyLabel="No regions configured"
        />
      </div>
      <p className="fish-demo-muted">
        {value.length > 0 ? `Saved path: ${value.join(' / ')}` : 'Nothing selected yet.'}
      </p>
    </div>
  )
}
