import { useState } from 'react'

import {
  Button,
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Label,
} from '@fish-admin/react'

const TRIGGER_STYLE = { width: '100%', justifyContent: 'space-between' }

const CONTENT_STYLE = {
  border: '1px solid var(--border)',
  borderRadius: '0.5rem',
  padding: '0.75rem',
  background: 'var(--muted)',
}

export default function CollapsibleBasic() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fish-demo-stack">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" style={TRIGGER_STYLE}>
            Advanced retention settings
            <span className="fish-demo-muted">{open ? 'Hide' : 'Show'}</span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent style={{ marginTop: '0.5rem' }}>
          <div style={CONTENT_STYLE}>
            <p className="fish-demo-muted" style={{ margin: '0 0 0.5rem' }}>
              Control how long exports and audit events are kept.
            </p>
            <div className="fish-demo-row" style={{ gap: '0.5rem' }}>
              <Checkbox id="demo-retention-exports" defaultChecked />
              <Label htmlFor="demo-retention-exports" style={{ fontWeight: 400 }}>
                Keep CSV exports for 30 days
              </Label>
            </div>
            <div className="fish-demo-row" style={{ gap: '0.5rem', marginTop: '0.5rem' }}>
              <Checkbox id="demo-retention-audit" defaultChecked />
              <Label htmlFor="demo-retention-audit" style={{ fontWeight: 400 }}>
                Retain audit events for 12 months
              </Label>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
