import { useState } from 'react'

import { AutoComplete, type AutoCompleteOption } from '@fish-admin/react'

const REVIEWERS: AutoCompleteOption[] = [
  { value: 'ada', label: 'Ada Lovelace', description: 'Engineering · Platform' },
  { value: 'grace', label: 'Grace Hopper', description: 'Engineering · Infrastructure' },
  { value: 'katherine', label: 'Katherine Johnson', description: 'Design · Product systems' },
  { value: 'alan', label: 'Alan Turing', description: 'Product · Growth' },
  {
    value: 'linus',
    label: 'Linus Torvalds',
    description: 'Contractor · access suspended',
    disabled: true,
  },
]

export default function AutoCompleteBasic() {
  const [value, setValue] = useState('')
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className="fish-demo-stack">
      <label htmlFor="demo-autocomplete-reviewer" className="fish-demo-label">
        Assign reviewer
      </label>
      <div className="fish-demo-w-72">
        <AutoComplete
          id="demo-autocomplete-reviewer"
          options={REVIEWERS}
          value={value}
          onValueChange={(next) => {
            setValue(next)
            setSelected(null)
          }}
          onSelect={(option) => setSelected(option.label)}
          placeholder="Search the directory"
          ariaLabel="Reviewer"
          emptyLabel="No matching reviewer"
        />
      </div>
      <p className="fish-demo-muted" aria-live="polite">
        {selected
          ? `Selected ${selected}`
          : 'Type a name, then pick a suggestion or keep your own text.'}
      </p>
    </div>
  )
}
