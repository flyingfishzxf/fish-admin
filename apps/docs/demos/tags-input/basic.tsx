import { useState } from 'react'

import { TagsInput } from '@fish-admin/react'

export default function TagsInputBasic() {
  const [tags, setTags] = useState<string[]>(['billing', 'p1'])

  return (
    <div className="fish-demo-stack">
      <p className="fish-demo-label" style={{ margin: 0 }}>
        Incident labels
      </p>
      <TagsInput
        value={tags}
        onChange={setTags}
        ariaLabel="Incident labels"
        placeholder="Add a label and press Enter"
        maxTags={5}
      />
      <p className="fish-demo-muted" aria-live="polite">
        {tags.length > 0
          ? `${tags.length} label(s), used to filter the on-call report.`
          : 'No labels yet. Type one and press Enter.'}
      </p>
      <p className="fish-demo-muted" style={{ margin: 0 }}>
        <code>Enter</code> or a comma commits the draft; pasting <code>a,b,c</code> splits into
        separate tags, and <code>Backspace</code> on an empty input removes the last one.
      </p>
    </div>
  )
}
