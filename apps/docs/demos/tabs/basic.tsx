import { useState } from 'react'

import {
  Button,
  Input,
  Label,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@fish-admin/react'

const PANEL_STYLE = { paddingTop: '0.75rem', minHeight: '8.5rem' }

export default function TabsBasic() {
  const [tab, setTab] = useState('profile')
  const [name, setName] = useState('Katherine Johnson')
  const [savedName, setSavedName] = useState('Katherine Johnson')
  const [productUpdates, setProductUpdates] = useState(true)
  const [twoFactor, setTwoFactor] = useState(false)

  return (
    <div className="fish-demo-stack">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" style={PANEL_STYLE}>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div style={{ display: 'grid', gap: '0.375rem' }}>
              <Label htmlFor="demo-tabs-display-name">Display name</Label>
              <Input
                id="demo-tabs-display-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="fish-demo-row">
              <Button size="sm" disabled={!name.trim()} onClick={() => setSavedName(name.trim())}>
                Save profile
              </Button>
              <span className="fish-demo-muted" aria-live="polite">
                Shown as {savedName}
              </span>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="notifications" style={PANEL_STYLE}>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
              }}
            >
              <div>
                <Label htmlFor="demo-tabs-product-updates">Product updates</Label>
                <p className="fish-demo-muted" style={{ margin: '0.25rem 0 0' }}>
                  Release notes about once a month.
                </p>
              </div>
              <Switch
                id="demo-tabs-product-updates"
                checked={productUpdates}
                onCheckedChange={setProductUpdates}
              />
            </div>
            <p className="fish-demo-muted" style={{ margin: 0 }} aria-live="polite">
              {productUpdates ? 'Product update emails are on.' : 'Product update emails are off.'}
            </p>
          </div>
        </TabsContent>
        <TabsContent value="security" style={PANEL_STYLE}>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
              }}
            >
              <div>
                <Label htmlFor="demo-tabs-two-factor">Two-factor authentication</Label>
                <p className="fish-demo-muted" style={{ margin: '0.25rem 0 0' }}>
                  Required for workspace owners.
                </p>
              </div>
              <Switch
                id="demo-tabs-two-factor"
                checked={twoFactor}
                onCheckedChange={setTwoFactor}
              />
            </div>
            <p className="fish-demo-muted" style={{ margin: 0 }} aria-live="polite">
              {twoFactor ? 'Two-factor authentication is on.' : 'Two-factor authentication is off.'}
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
