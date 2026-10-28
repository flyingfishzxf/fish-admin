import { useState } from 'react'

import {
  Badge,
  Button,
  Checkbox,
  Label,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@fish-admin/react'

const CHANNELS = [
  { id: 'digest', label: 'Weekly digest' },
  { id: 'mentions', label: 'Mentions' },
  { id: 'approvals', label: 'Approvals' },
]

export default function PopoverBasic() {
  const [selected, setSelected] = useState<string[]>(['mentions', 'approvals'])

  const toggle = (id: string, checked: boolean) => {
    setSelected((current) => (checked ? [...current, id] : current.filter((item) => item !== id)))
  }

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-row">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              Filter notifications
              <Badge variant="secondary">{selected.length}</Badge>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" aria-label="Notification filters">
            <PopoverHeader>
              <PopoverTitle>Notification filters</PopoverTitle>
              <PopoverDescription>Choose which alerts reach your inbox.</PopoverDescription>
            </PopoverHeader>
            <div className="fish-demo-stack" style={{ gap: '0.5rem', marginTop: '0.75rem' }}>
              {CHANNELS.map((channel) => (
                <div key={channel.id} className="fish-demo-row" style={{ gap: '0.5rem' }}>
                  <Checkbox
                    id={`demo-popover-channel-${channel.id}`}
                    checked={selected.includes(channel.id)}
                    onCheckedChange={(checked) => toggle(channel.id, checked === true)}
                  />
                  <Label htmlFor={`demo-popover-channel-${channel.id}`}>{channel.label}</Label>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              style={{ marginTop: '0.5rem', paddingLeft: 0 }}
              onClick={() => setSelected([])}
            >
              Clear all
            </Button>
          </PopoverContent>
        </Popover>
        <p className="fish-demo-muted" style={{ margin: 0 }}>
          {selected.length === 0
            ? 'All notification emails are muted.'
            : `Receiving ${selected.length} of ${CHANNELS.length} notification types.`}
        </p>
      </div>
    </div>
  )
}
