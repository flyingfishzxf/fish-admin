import { useState } from 'react'

import { Combobox, type ComboboxOption } from '@fish-admin/react'

const TEAMS: ComboboxOption[] = [
  {
    value: 'platform',
    label: 'Platform',
    description: 'Runtime, deploy pipeline and observability',
  },
  {
    value: 'product',
    label: 'Product',
    description: 'Core workspace, reporting and billing surfaces',
  },
  {
    value: 'design',
    label: 'Design',
    description: 'Design system and interaction patterns',
  },
  {
    value: 'support',
    label: 'Support',
    description: 'Escalations and customer onboarding',
  },
]

export default function ComboboxBasic() {
  const [team, setTeam] = useState<string | null>('platform')
  const selected = TEAMS.find((option) => option.value === team)

  return (
    <div className="fish-demo-stack">
      <p className="fish-demo-label" style={{ margin: 0 }}>
        Owning team
      </p>
      <Combobox
        options={TEAMS}
        value={team}
        onChange={setTeam}
        onClear={() => setTeam(null)}
        placeholder="Assign a team"
        searchPlaceholder="Search teams"
        ariaLabel="Owning team"
        clearLabel="Clear owning team"
      />
      <p className="fish-demo-muted" aria-live="polite">
        {selected
          ? `${selected.label} — ${selected.description}`
          : 'Unassigned. New incidents will not page anyone.'}
      </p>
    </div>
  )
}
