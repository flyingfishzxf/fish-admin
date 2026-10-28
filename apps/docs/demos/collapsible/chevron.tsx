import { useState } from 'react'

import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Separator,
} from '@fish-admin/react'
import { ChevronDown } from 'lucide-react'

const TRIGGER_STYLE = { width: '100%', justifyContent: 'space-between' }

const CONTENT_STYLE = {
  border: '1px solid var(--border)',
  borderRadius: '0.5rem',
  padding: '0.75rem',
  background: 'var(--muted)',
  fontSize: '0.875rem',
}

export default function CollapsibleChevron() {
  const [open, setOpen] = useState(true)

  return (
    <div className="fish-demo-stack">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" style={TRIGGER_STYLE}>
            Export details
            <ChevronDown
              aria-hidden="true"
              style={{
                width: '1rem',
                height: '1rem',
                transition: 'transform 150ms ease',
                transform: open ? 'rotate(180deg)' : 'none',
              }}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent style={{ marginTop: '0.5rem' }}>
          <div style={CONTENT_STYLE}>
            <p style={{ margin: 0 }}>workspace-members-2026-10.csv</p>
            <p className="fish-demo-muted" style={{ margin: '0.25rem 0 0.5rem' }}>
              1,284 rows · generated 12 minutes ago
            </p>
            <Separator style={{ margin: '0.5rem 0' }} />
            <p className="fish-demo-muted" style={{ margin: 0 }}>
              Downloads expire after 30 days. Regenerate at any time from Reports.
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
      <p className="fish-demo-muted" aria-live="polite">
        {open ? 'Details are expanded.' : 'Details are collapsed.'}
      </p>
    </div>
  )
}
