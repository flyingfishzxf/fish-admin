import { ArrowLeft } from 'lucide-react'

import { Avatar, AvatarFallback, Badge, Button, DetailPage } from '@fish-admin/react'

const details: [string, string][] = [
  ['Status', 'Running — 42 of 60 checks green'],
  ['Owner', 'Grace Hopper'],
  ['Target region', 'eu-west-1'],
  ['Freeze window', 'Nov 27, 2026 to Dec 1, 2026'],
]

export default function DetailPageSingleSection() {
  return (
    <div style={{ width: '100%' }}>
      <DetailPage
        back={
          <Button type="button" variant="ghost" size="sm">
            <ArrowLeft />
            Back to projects
          </Button>
        }
        avatar={
          <Avatar size="lg">
            <AvatarFallback>NP</AvatarFallback>
          </Avatar>
        }
        title="Northwind migration"
        subtitle="Rolling out the v2 data pipeline"
        badges={<Badge variant="secondary">In progress</Badge>}
        meta={
          <>
            <span>Owner: Grace Hopper</span>
            <span aria-hidden>·</span>
            <span>Due Nov 30, 2026</span>
          </>
        }
        actions={
          <Button type="button" size="sm">
            Edit plan
          </Button>
        }
        footer={
          <div
            className="fish-demo-row"
            style={{
              justifyContent: 'flex-end',
              borderTop: '1px solid var(--border)',
              paddingTop: '1rem',
            }}
          >
            <Button type="button" variant="outline" size="sm">
              Export summary
            </Button>
            <Button type="button" size="sm">
              Share
            </Button>
          </div>
        }
      >
        <div className="fish-demo-stack">
          <p style={{ margin: 0 }}>
            This record passes a single body through <code>children</code> instead of tabbed
            sections, adds a <code>back</code> node above the header, and closes with a{' '}
            <code>footer</code> action row — the layout the component falls back to whenever{' '}
            <code>tabs</code> is empty.
          </p>
          <dl
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: '0.75rem',
              margin: 0,
              fontSize: '0.875rem',
            }}
          >
            {details.map(([label, value]) => (
              <div key={label}>
                <dt className="fish-demo-label" style={{ margin: 0 }}>
                  {label}
                </dt>
                <dd style={{ margin: 0 }}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </DetailPage>
    </div>
  )
}
