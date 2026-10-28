import { useState } from 'react'

import { Cascader, type CascaderOption } from '@fish-admin/react'

const OPTIONS: CascaderOption[] = [
  {
    value: 'europe',
    label: 'Europe',
    children: [
      {
        value: 'germany',
        label: 'Germany',
        children: [
          { value: 'berlin', label: 'Berlin' },
          { value: 'munich', label: 'Munich' },
        ],
      },
      {
        value: 'nordics',
        label: 'Nordics',
        children: [
          { value: 'stockholm', label: 'Stockholm' },
          { value: 'oslo', label: 'Oslo', disabled: true },
        ],
      },
    ],
  },
  {
    value: 'antarctica',
    label: 'Antarctica',
    disabled: true,
    children: [{ value: 'rothera', label: 'Rothera' }],
  },
]

export default function CascaderPreset() {
  const [value, setValue] = useState<string[]>(['europe', 'germany', 'berlin'])

  return (
    <div className="fish-demo-stack">
      <p className="fish-demo-label">Cost center · pre-filled from the contract</p>
      <div className="fish-demo-w-72">
        <Cascader
          options={OPTIONS}
          value={value}
          onChange={setValue}
          onClear={() => setValue([])}
          placeholder="Select a cost center"
          ariaLabel="Cost center"
          clearLabel="Clear cost center"
        />
      </div>
      <p className="fish-demo-muted">
        {value.length > 0
          ? `Billing office: ${value.join(' / ')}`
          : 'Cleared — pick a branch again.'}
      </p>
      <p className="fish-demo-muted">
        Oslo and the whole Antarctica branch are disabled; disabled nodes never commit a path.
      </p>
    </div>
  )
}
