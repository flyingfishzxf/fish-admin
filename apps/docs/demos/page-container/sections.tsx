import { useState } from 'react'

import { Button, PageContainer, Segmented } from '@fish-admin/react'
import { Settings2 } from 'lucide-react'

const TAB_BODY: Record<string, string> = {
  overview: '18 members have access, 4 as billing owners and 2 as workspace admins.',
  pending: '3 invitations are waiting: grace@fish.dev, alan@fish.dev and edsger@fish.dev.',
  audit: 'The last access change was a role upgrade for ada@fish.dev on October 26, 2026.',
}

export default function PageContainerSections() {
  const [tab, setTab] = useState('overview')

  return (
    <div
      style={{
        width: '100%',
        padding: '1rem',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        background: 'var(--background)',
      }}
    >
      <PageContainer
        eyebrow="Workspace"
        title="Team members"
        description="Manage who can access the Acme workspace and what they can do."
        actions={
          <Button type="button" size="sm" variant="outline">
            <Settings2 aria-hidden="true" />
            Manage roles
          </Button>
        }
        tabs={
          <div style={{ paddingBottom: '0.5rem' }}>
            <Segmented
              aria-label="Member views"
              size="sm"
              value={tab}
              onValueChange={setTab}
              options={[
                { value: 'overview', label: 'Overview' },
                { value: 'pending', label: 'Pending invites' },
                { value: 'audit', label: 'Access log' },
              ]}
            />
          </div>
        }
        footer={
          <p className="fish-demo-muted" style={{ margin: 0 }}>
            Last synced with Okta at 09:41 UTC. Changes are logged for 90 days.
          </p>
        }
      >
        <p style={{ margin: 0 }}>{TAB_BODY[tab]}</p>
      </PageContainer>
    </div>
  )
}
