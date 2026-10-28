import { Badge, Descriptions } from '@fish-admin/react'

export default function DescriptionsColumns() {
  return (
    <div className="fish-demo-stack" style={{ maxWidth: '40rem' }}>
      <p className="fish-demo-label" style={{ margin: 0 }}>
        Incident 4821 · three columns
      </p>
      <Descriptions
        columns={3}
        items={[
          { term: 'Service', description: 'billing-api' },
          { term: 'Severity', description: <Badge variant="destructive">Sev 1</Badge> },
          { term: 'Owner', description: 'Grace Hopper' },
          { term: 'Region', description: 'eu-central' },
          { term: 'Detected', description: '09:42 UTC' },
          { term: 'Acknowledged', description: '09:44 UTC' },
          {
            term: 'Summary',
            description:
              'Invoice retries doubled after the 09:30 deploy; the queue drained at 10:12 UTC.',
            span: 2,
          },
        ]}
      />
      <p className="fish-demo-muted" style={{ margin: 0 }}>
        <code>columns</code> accepts 1, 2 or 3 and applies from the <code>sm</code> breakpoint up;
        below it every item stacks in one column. <code>span: 2</code> makes an item two columns
        wide; a three-column span is not available.
      </p>
    </div>
  )
}
