import { useState } from 'react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
} from '@fish-admin/react'

const PANEL_STYLE = {
  width: '100%',
  border: '1px solid var(--border)',
  borderRadius: '0.5rem',
  padding: '0 1rem',
  background: 'var(--card)',
}

const QUESTIONS = {
  notifications: 'Which notifications can members mute?',
  audit: 'How long are audit entries retained?',
  scim: 'Does SCIM provisioning remove deprovisioned members?',
}

export default function AccordionControlled() {
  const [openItems, setOpenItems] = useState<string[]>(['notifications', 'audit'])

  return (
    <div className="fish-demo-stack">
      <Accordion type="multiple" value={openItems} onValueChange={setOpenItems} style={PANEL_STYLE}>
        <AccordionItem value="notifications">
          <AccordionTrigger>{QUESTIONS.notifications}</AccordionTrigger>
          <AccordionContent>
            Members can mute release, comment and mention notifications per workspace; billing and
            security notices always stay on.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="audit">
          <AccordionTrigger>{QUESTIONS.audit}</AccordionTrigger>
          <AccordionContent>
            Audit entries are kept for 18 months on Team and 36 months on Enterprise; exports use
            the same window.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="scim">
          <AccordionTrigger>{QUESTIONS.scim}</AccordionTrigger>
          <AccordionContent>
            Yes. Once a member is deprovisioned in the identity provider, the next SCIM sync
            suspends the account and transfers owned projects to the workspace.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <div className="fish-demo-row">
        <span className="fish-demo-muted" aria-live="polite">
          {openItems.length === 0
            ? 'All panels are closed.'
            : `${openItems.length} of 3 panels open.`}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={openItems.length === 0}
          onClick={() => setOpenItems([])}
        >
          Collapse all
        </Button>
      </div>
    </div>
  )
}
