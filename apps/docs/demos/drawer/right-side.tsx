import { useState } from 'react'

import {
  Button,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Input,
  Label,
} from '@fish-admin/react'
import { Pencil } from 'lucide-react'

export default function DrawerRightSide() {
  const [open, setOpen] = useState(false)
  const [projectName, setProjectName] = useState('Atlas redesign')
  const [draft, setDraft] = useState('Atlas redesign')
  const [error, setError] = useState<string | null>(null)

  function handleOpenChange(next: boolean) {
    if (next) {
      setDraft(projectName)
      setError(null)
    }
    setOpen(next)
  }

  function handleSave() {
    const value = draft.trim()
    if (value.length < 3) {
      setError('Use at least 3 characters.')
      return
    }
    setProjectName(value)
    setOpen(false)
  }

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-row">
        <Drawer direction="right" open={open} onOpenChange={handleOpenChange}>
          <DrawerTrigger asChild>
            <Button variant="outline">
              <Pencil size={16} />
              Rename project
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Rename project</DrawerTitle>
              <DrawerDescription>The new name is visible to every member.</DrawerDescription>
            </DrawerHeader>
            <div style={{ display: 'grid', gap: '0.375rem', padding: '0 1.5rem' }}>
              <Label htmlFor="demo-drawer-project-name">Project name</Label>
              <Input
                id="demo-drawer-project-name"
                value={draft}
                maxLength={40}
                onChange={(event) => {
                  setDraft(event.target.value)
                  setError(null)
                }}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'demo-drawer-project-error' : undefined}
              />
              {error ? (
                <p
                  id="demo-drawer-project-error"
                  role="alert"
                  style={{ margin: 0, fontSize: '0.85rem', color: 'var(--destructive)' }}
                >
                  {error}
                </p>
              ) : (
                <p className="fish-demo-muted" style={{ margin: 0 }}>
                  {draft.length} / 40 characters
                </p>
              )}
            </div>
            <DrawerFooter>
              <Button onClick={handleSave}>Save name</Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
        <p className="fish-demo-muted" aria-live="polite">
          Current project: {projectName}
        </p>
      </div>
    </div>
  )
}
