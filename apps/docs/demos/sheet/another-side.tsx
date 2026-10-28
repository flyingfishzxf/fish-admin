import { useState } from 'react'

import {
  Button,
  Checkbox,
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

const FILTERS = [
  { key: 'sessions', label: 'Sign-in events' },
  { key: 'billing', label: 'Billing changes' },
  { key: 'permissions', label: 'Permission changes' },
] as const

type FilterKey = (typeof FILTERS)[number]['key']

export default function SheetAnotherSide() {
  const [open, setOpen] = useState(false)
  const [applied, setApplied] = useState<FilterKey[]>(['sessions'])
  const [draft, setDraft] = useState<FilterKey[]>(['sessions'])

  function handleOpenChange(next: boolean) {
    if (next) setDraft(applied)
    setOpen(next)
  }

  function toggleFilter(key: FilterKey) {
    setDraft((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    )
  }

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-row">
        <Sheet open={open} onOpenChange={handleOpenChange}>
          <SheetTrigger asChild>
            <Button variant="outline">Filter activity</Button>
          </SheetTrigger>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>Filter activity</SheetTitle>
              <SheetDescription>Choose which audit events the log shows.</SheetDescription>
            </SheetHeader>
            <div style={{ display: 'grid', gap: '0.75rem', padding: '0 1rem' }}>
              {FILTERS.map((filter) => (
                <div key={filter.key} className="fish-demo-row">
                  <Checkbox
                    id={`demo-sheet-filter-${filter.key}`}
                    checked={draft.includes(filter.key)}
                    onCheckedChange={() => toggleFilter(filter.key)}
                  />
                  <Label htmlFor={`demo-sheet-filter-${filter.key}`}>{filter.label}</Label>
                </div>
              ))}
            </div>
            <SheetFooter>
              <Button
                disabled={draft.length === 0}
                onClick={() => {
                  setApplied(draft)
                  setOpen(false)
                }}
              >
                Apply filters
              </Button>
              <SheetClose asChild>
                <Button variant="outline">Cancel</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        <p className="fish-demo-muted" aria-live="polite">
          {applied.length} of {FILTERS.length} event types shown
        </p>
      </div>
    </div>
  )
}
