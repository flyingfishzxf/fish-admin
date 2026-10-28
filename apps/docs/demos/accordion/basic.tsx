import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@fish-admin/react'

const PANEL_STYLE = {
  width: '100%',
  border: '1px solid var(--border)',
  borderRadius: '0.5rem',
  padding: '0 1rem',
  background: 'var(--card)',
}

export default function AccordionBasic() {
  return (
    <div className="fish-demo-stack">
      <Accordion type="single" collapsible defaultValue="billing" style={PANEL_STYLE}>
        <AccordionItem value="billing">
          <AccordionTrigger>How does per-seat billing work?</AccordionTrigger>
          <AccordionContent>
            You are billed for active members at the end of each monthly cycle. Invited members are
            counted once they accept.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="security">
          <AccordionTrigger>Where is workspace data stored?</AccordionTrigger>
          <AccordionContent>
            Data stays in the region selected at creation time, and audit exports follow the same
            retention policy.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="sso">
          <AccordionTrigger>Can owners enforce SSO for everyone?</AccordionTrigger>
          <AccordionContent>
            Yes. Owners can require single sign-on under Security, which disables password sign-in
            workspace-wide.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <p className="fish-demo-muted">
        Single mode with <code>collapsible</code> lets you close the open panel; opening another
        question replaces it.
      </p>
    </div>
  )
}
