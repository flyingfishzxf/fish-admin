import { useState } from 'react'

import { TagsInput } from '@fish-admin/react'

const SUGGESTIONS = [
  { label: 'frontend', value: 'frontend' },
  { label: 'backend', value: 'backend' },
  { label: 'security', value: 'security' },
]

export default function TagsInputSuggestions() {
  const [tags, setTags] = useState<string[]>(['api'])

  return (
    <div className="fish-demo-stack">
      <p className="fish-demo-label" style={{ margin: 0 }}>
        Team skills
      </p>
      <TagsInput
        value={tags}
        onChange={setTags}
        ariaLabel="Team skills"
        placeholder="Add a skill"
        maxTags={4}
        maxLength={16}
        suggestions={SUGGESTIONS}
      />
      <p className="fish-demo-muted" aria-live="polite">
        {tags.length >= 4
          ? 'Skill limit reached. Remove one to add another.'
          : `Tap a suggestion or type your own. ${4 - tags.length} slot(s) left.`}
      </p>
      <p className="fish-demo-muted" style={{ margin: 0 }}>
        <code>suggestions</code> render as dashed quick-add chips below the input. They share the
        <code> maxTags</code> budget, so every chip disables once the fourth tag lands.
      </p>
    </div>
  )
}
