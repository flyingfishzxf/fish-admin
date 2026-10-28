import { useState } from 'react'

import { Combobox, type ComboboxOption } from '@fish-admin/react'

const REGIONS: ComboboxOption[] = [
  { value: 'eu-central', label: 'EU Central', description: 'Frankfurt · 12 ms' },
  { value: 'us-east', label: 'US East', description: 'Virginia · 88 ms' },
  { value: 'ap-south', label: 'AP South', description: 'Mumbai · 143 ms' },
  {
    value: 'gov-west',
    label: 'Gov West',
    description: 'Restricted region · request access',
    disabled: true,
  },
]

export default function ComboboxStates() {
  const [region, setRegion] = useState<string | null>('eu-central')

  return (
    <div className="fish-demo-stack" style={{ gap: '1.25rem' }}>
      <div className="fish-demo-stack" style={{ gap: '0.4rem' }}>
        <p className="fish-demo-label" style={{ margin: 0 }}>
          Primary data region
        </p>
        <Combobox
          options={REGIONS}
          value={region}
          onChange={setRegion}
          onClear={() => setRegion(null)}
          placeholder="Choose a region"
          searchPlaceholder="Search regions"
          ariaLabel="Primary data region"
          clearLabel="Clear primary region"
        />
        <p className="fish-demo-muted" aria-live="polite">
          {region
            ? `Writes will be pinned to ${REGIONS.find((option) => option.value === region)?.label}.`
            : 'No region selected — the workspace default applies.'}
        </p>
      </div>
      <div className="fish-demo-stack" style={{ gap: '0.4rem' }}>
        <p className="fish-demo-label" style={{ margin: 0 }}>
          Failover region (locked by the enterprise plan)
        </p>
        <Combobox
          options={REGIONS}
          value="us-east"
          onChange={() => undefined}
          placeholder="Choose a region"
          ariaLabel="Failover data region"
          disabled
        />
      </div>
      <p className="fish-demo-muted" style={{ margin: 0 }}>
        Gov West is an option with <code>disabled: true</code>, so it stays visible and searchable
        but cannot be chosen. A disabled control still renders its label and stops the clear button.
      </p>
    </div>
  )
}
