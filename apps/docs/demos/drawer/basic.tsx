import { useState } from 'react'

import {
  Button,
  Checkbox,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Label,
} from '@fish-admin/react'

interface Preferences {
  signin: boolean
  digest: boolean
}

const INITIAL_PREFERENCES: Preferences = { signin: true, digest: false }

export default function DrawerBasic() {
  const [open, setOpen] = useState(false)
  const [applied, setApplied] = useState<Preferences>(INITIAL_PREFERENCES)
  const [draft, setDraft] = useState<Preferences>(INITIAL_PREFERENCES)

  function handleOpenChange(next: boolean) {
    if (next) setDraft(applied)
    setOpen(next)
  }

  function setDraftValue(key: keyof Preferences, value: boolean) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-row">
        <Drawer open={open} onOpenChange={handleOpenChange}>
          <DrawerTrigger asChild>
            <Button variant="outline">Notification settings</Button>
          </DrawerTrigger>
          <DrawerContent style={{ maxWidth: '32rem', marginLeft: 'auto', marginRight: 'auto' }}>
            <DrawerHeader>
              <DrawerTitle>Notification settings</DrawerTitle>
              <DrawerDescription>Choose which emails this workspace sends you.</DrawerDescription>
            </DrawerHeader>
            <div style={{ display: 'grid', gap: '0.75rem', padding: '0 1.5rem' }}>
              <div className="fish-demo-row">
                <Checkbox
                  id="demo-drawer-signin"
                  checked={draft.signin}
                  onCheckedChange={(checked) => setDraftValue('signin', checked === true)}
                />
                <Label htmlFor="demo-drawer-signin">Sign-in alerts</Label>
              </div>
              <div className="fish-demo-row">
                <Checkbox
                  id="demo-drawer-digest"
                  checked={draft.digest}
                  onCheckedChange={(checked) => setDraftValue('digest', checked === true)}
                />
                <Label htmlFor="demo-drawer-digest">Weekly digest</Label>
              </div>
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button onClick={() => setApplied(draft)}>Save preferences</Button>
              </DrawerClose>
              <DrawerClose asChild>
                <Button variant="outline">Not now</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
        <p className="fish-demo-muted" aria-live="polite">
          Sign-in alerts {applied.signin ? 'on' : 'off'} · Weekly digest{' '}
          {applied.digest ? 'on' : 'off'}
        </p>
      </div>
    </div>
  )
}
