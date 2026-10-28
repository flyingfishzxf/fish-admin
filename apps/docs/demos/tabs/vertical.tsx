import { useState } from 'react'

import { Label, Switch, Tabs, TabsContent, TabsList, TabsTrigger } from '@fish-admin/react'

const PANEL_STYLE = {
  border: '1px solid var(--border)',
  borderRadius: '0.5rem',
  padding: '0.75rem',
  fontSize: '0.875rem',
  minHeight: '6.5rem',
}

export default function TabsVertical() {
  const [isOwner, setIsOwner] = useState(false)
  const [tab, setTab] = useState('general')

  function handleOwnerChange(next: boolean) {
    setIsOwner(next)
    if (!next && tab === 'billing') setTab('general')
  }

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-row">
        <Switch id="demo-tabs-owner" checked={isOwner} onCheckedChange={handleOwnerChange} />
        <Label htmlFor="demo-tabs-owner">View as workspace owner</Label>
      </div>
      <Tabs value={tab} onValueChange={setTab} orientation="vertical">
        <TabsList variant="line">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="billing" disabled={!isOwner}>
            Billing
          </TabsTrigger>
        </TabsList>
        <TabsContent value="general" style={PANEL_STYLE}>
          <p style={{ margin: 0 }}>Workspace name: Acme Design</p>
          <p className="fish-demo-muted" style={{ margin: '0.375rem 0 0' }}>
            Region eu-central-1 · Plan Team
          </p>
        </TabsContent>
        <TabsContent value="members" style={PANEL_STYLE}>
          <p style={{ margin: 0 }}>5 members, 2 invitations pending.</p>
          <p className="fish-demo-muted" style={{ margin: '0.375rem 0 0' }}>
            Owners can invite or remove members.
          </p>
        </TabsContent>
        <TabsContent value="billing" style={PANEL_STYLE}>
          <p style={{ margin: 0 }}>Card ending 4242 · renews 2026-11-01</p>
        </TabsContent>
      </Tabs>
      <p className="fish-demo-muted" aria-live="polite">
        {isOwner ? 'Owner view: billing is enabled.' : 'Viewer view: billing stays disabled.'}
      </p>
    </div>
  )
}
