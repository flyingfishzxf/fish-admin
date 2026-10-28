import { useState } from 'react'

import {
  Button,
  Input,
  Label,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@fish-admin/react'

const INITIAL_PROFILE = { name: 'Katherine Johnson', email: 'katherine@example.com' }

export default function SheetBasic() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(INITIAL_PROFILE.name)
  const [email, setEmail] = useState(INITIAL_PROFILE.email)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<{ name: string; email: string } | null>(null)

  function handleOpenChange(next: boolean) {
    if (next) {
      setName(saved?.name ?? INITIAL_PROFILE.name)
      setEmail(saved?.email ?? INITIAL_PROFILE.email)
      setError(null)
    }
    setOpen(next)
  }

  function handleSave() {
    if (!name.trim()) {
      setError('Enter a display name.')
      return
    }
    if (!email.includes('@')) {
      setError('Enter a valid email address.')
      return
    }
    setError(null)
    setSaved({ name: name.trim(), email: email.trim() })
    setOpen(false)
  }

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-row">
        <Sheet open={open} onOpenChange={handleOpenChange}>
          <SheetTrigger asChild>
            <Button variant="outline">Edit profile</Button>
          </SheetTrigger>
          <SheetContent side="right" style={{ width: '100%', maxWidth: '22rem' }}>
            <SheetHeader>
              <SheetTitle>Edit profile</SheetTitle>
              <SheetDescription>Update the member name and contact email.</SheetDescription>
            </SheetHeader>
            <div style={{ display: 'grid', gap: '0.75rem', padding: '0 1rem' }}>
              <div style={{ display: 'grid', gap: '0.375rem' }}>
                <Label htmlFor="demo-sheet-name">Display name</Label>
                <Input
                  id="demo-sheet-name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value)
                    setError(null)
                  }}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? 'demo-sheet-error' : undefined}
                />
              </div>
              <div style={{ display: 'grid', gap: '0.375rem' }}>
                <Label htmlFor="demo-sheet-email">Email</Label>
                <Input
                  id="demo-sheet-email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setError(null)
                  }}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? 'demo-sheet-error' : undefined}
                />
              </div>
              {error ? (
                <p
                  id="demo-sheet-error"
                  role="alert"
                  style={{ margin: 0, fontSize: '0.85rem', color: 'var(--destructive)' }}
                >
                  {error}
                </p>
              ) : (
                <p className="fish-demo-muted" style={{ margin: 0 }}>
                  Both fields are required.
                </p>
              )}
            </div>
            <SheetFooter>
              <Button onClick={handleSave}>Save changes</Button>
              <SheetClose asChild>
                <Button variant="outline">Cancel</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        <p className="fish-demo-muted" aria-live="polite">
          {saved ? `Saved ${saved.name} · ${saved.email}` : 'No changes yet.'}
        </p>
      </div>
    </div>
  )
}
