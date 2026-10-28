import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  DetailPage,
  type DetailPageTab,
} from '@fish-admin/react'

const overviewRows: [string, string][] = [
  ['Email', 'ada@fishadmin.dev'],
  ['Team', 'Platform reliability'],
  ['Location', 'London, UK'],
  ['Manager', 'Charles Babbage'],
]

const activityItems = [
  'Approved the Q4 access review.',
  'Merged the deploy-pipeline hardening PR.',
  'Assigned two on-call rotations.',
]

export default function DetailPageBasic() {
  const tabs: DetailPageTab[] = [
    {
      value: 'overview',
      label: 'Overview',
      content: (
        <div className="fish-demo-stack">
          <div>
            <p className="fish-demo-label" style={{ margin: 0 }}>
              About
            </p>
            <p style={{ margin: '0.25rem 0 0' }}>
              Principal engineer on the platform reliability team, focused on deploy pipelines and
              on-call tooling.
            </p>
          </div>
          <dl
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: '0.75rem',
              margin: 0,
              fontSize: '0.875rem',
            }}
          >
            {overviewRows.map(([label, value]) => (
              <div key={label}>
                <dt className="fish-demo-label" style={{ margin: 0 }}>
                  {label}
                </dt>
                <dd style={{ margin: 0 }}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ),
    },
    {
      value: 'activity',
      label: 'Activity',
      content: (
        <ul
          className="fish-demo-stack"
          style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: '0.875rem' }}
        >
          {activityItems.map((text) => (
            <li key={text} className="fish-demo-row">
              <span
                aria-hidden
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: 'var(--primary)',
                  flexShrink: 0,
                }}
              />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      ),
    },
  ]

  return (
    <div style={{ width: '100%' }}>
      <DetailPage
        avatar={
          <Avatar size="lg">
            <AvatarFallback>AL</AvatarFallback>
          </Avatar>
        }
        title="Ada Lovelace"
        subtitle="ada@fishadmin.dev"
        badges={<Badge>Active</Badge>}
        meta={
          <>
            <span>Principal engineer</span>
            <span aria-hidden>·</span>
            <span>Platform reliability</span>
          </>
        }
        actions={
          <>
            <Button type="button" variant="outline" size="sm">
              Message
            </Button>
            <Button type="button" size="sm">
              Edit
            </Button>
          </>
        }
        tabs={tabs}
        tabsLabel="Profile sections"
      />
    </div>
  )
}
