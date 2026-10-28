import { Badge, Descriptions } from '@fish-admin/react'

export default function DescriptionsBasic() {
  return (
    <div className="fish-demo-stack">
      <Descriptions
        columns={2}
        items={[
          { term: 'Email', description: 'ada@example.com' },
          {
            term: 'Role',
            description: <Badge variant="secondary">Workspace admin</Badge>,
          },
          { term: 'Team', description: 'Platform' },
          { term: 'Joined', description: '2025-01-08' },
          { term: 'Last active', description: '2 hours ago', span: 2 },
        ]}
      />
      <p className="fish-demo-muted" style={{ margin: 0 }}>
        Terms are <code>dt</code> elements in 12 px muted text, values are <code>dd</code> elements
        at 14 px. The last item sets <code>span: 2</code> so it fills the row.
      </p>
    </div>
  )
}
