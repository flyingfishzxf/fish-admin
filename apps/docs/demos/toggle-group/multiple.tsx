import { useState } from 'react'

import { Bold, Italic, Underline } from 'lucide-react'

import { ToggleGroup, ToggleGroupItem } from '@fish-admin/react'

const FORMATS = [
  { value: 'bold', label: 'Bold', icon: Bold },
  { value: 'italic', label: 'Italic', icon: Italic },
  { value: 'underline', label: 'Underline', icon: Underline },
] as const

const CHANNELS = ['Email', 'Slack', 'SMS']

export default function ToggleGroupMultiple() {
  const [formats, setFormats] = useState<string[]>(['bold'])
  const [channels, setChannels] = useState<string[]>(['Email'])

  return (
    <div className="fish-demo-stack">
      <div style={{ width: 320 }}>
        <ToggleGroup
          type="multiple"
          value={formats}
          onValueChange={setFormats}
          aria-label="Text formatting"
        >
          {FORMATS.map(({ value, label, icon: Icon }) => (
            <ToggleGroupItem key={value} value={value}>
              <Icon />
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div style={{ width: 320 }}>
        <ToggleGroup
          type="multiple"
          variant="outline"
          spacing={1}
          value={channels}
          onValueChange={setChannels}
          aria-label="Notification channels"
        >
          {CHANNELS.map((channel) => (
            <ToggleGroupItem key={channel} value={channel}>
              {channel}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <p className="fish-demo-muted" style={{ margin: 0 }}>
        <code>type=&quot;multiple&quot;</code> keeps an array; any combination, including none, is
        valid. The second group sets <code>{'spacing={1}'}</code>, so the outline items are
        separated instead of joined.
      </p>
      <p className="fish-demo-muted" style={{ margin: 0 }} aria-live="polite">
        {`Formats: ${formats.join(', ') || 'none'} · Channels: ${channels.join(', ') || 'none'}`}
      </p>
    </div>
  )
}
