import { useState } from 'react'

import { AutoComplete, type AutoCompleteOption } from '@fish-admin/react'

const TEAMS: AutoCompleteOption[] = [
  { value: 'platform', label: 'Platform', description: 'Runtime and infrastructure' },
  { value: 'payments', label: 'Payments', description: 'Checkout and billing' },
  { value: 'growth', label: 'Growth', description: 'Onboarding experiments' },
]

export default function AutoCompleteStates() {
  const [pending, setPending] = useState('')
  const [query, setQuery] = useState('Nightingale')

  return (
    <div className="fish-demo-stack">
      <div>
        <label htmlFor="demo-autocomplete-loading" className="fish-demo-label">
          Loading results
        </label>
        <AutoComplete
          id="demo-autocomplete-loading"
          options={[]}
          value={pending}
          onValueChange={setPending}
          loading
          loadingLabel="Searching the directory…"
          placeholder="Type a team"
          ariaLabel="Team search, loading"
          className="fish-demo-w-72"
        />
      </div>
      <div>
        <p className="fish-demo-label">Read-only assignment</p>
        <AutoComplete
          options={TEAMS}
          value="Platform"
          onValueChange={() => undefined}
          disabled
          placeholder="No owner"
          ariaLabel="Team search, disabled"
          className="fish-demo-w-72"
        />
      </div>
      <div>
        <label htmlFor="demo-autocomplete-empty" className="fish-demo-label">
          No results yet
        </label>
        <AutoComplete
          id="demo-autocomplete-empty"
          options={TEAMS}
          value={query}
          onValueChange={setQuery}
          placeholder="Type a team"
          ariaLabel="Team search, empty state"
          emptyLabel="No team matches that name"
          className="fish-demo-w-72"
        />
      </div>
      <p className="fish-demo-muted">
        The first field stays in its loading row, the second is disabled, the third starts on a
        query that matches nothing.
      </p>
    </div>
  )
}
