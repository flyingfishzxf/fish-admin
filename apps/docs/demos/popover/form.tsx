import { useState } from 'react'

import {
  Button,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@fish-admin/react'

export default function PopoverForm() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [saved, setSaved] = useState('')

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-row">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              Create label
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            aria-labelledby="demo-popover-form-title"
            aria-describedby="demo-popover-form-description"
          >
            <form
              className="fish-demo-stack"
              style={{ gap: '0.6rem' }}
              onSubmit={(event) => {
                event.preventDefault()
                const value = name.trim()
                if (value.length === 0) return
                setSaved(value)
                setName('')
                setOpen(false)
              }}
            >
              <PopoverHeader>
                <PopoverTitle id="demo-popover-form-title">New label</PopoverTitle>
                <PopoverDescription id="demo-popover-form-description">
                  Labels group reports across the workspace.
                </PopoverDescription>
              </PopoverHeader>
              <div className="fish-demo-stack" style={{ gap: '0.35rem' }}>
                <Label htmlFor="demo-popover-form-name">Label name</Label>
                <Input
                  id="demo-popover-form-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Quarterly review"
                />
              </div>
              <div className="fish-demo-row" style={{ justifyContent: 'flex-end' }}>
                <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={name.trim().length === 0}>
                  Save label
                </Button>
              </div>
            </form>
          </PopoverContent>
        </Popover>
        <p className="fish-demo-muted" aria-live="polite" style={{ margin: 0 }}>
          {saved ? `Saved “${saved}”.` : 'The form opens aligned to the start of its trigger.'}
        </p>
      </div>
    </div>
  )
}
