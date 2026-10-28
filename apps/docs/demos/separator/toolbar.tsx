import { useState } from 'react'

import { Button, Separator } from '@fish-admin/react'
import { Bold, Italic, RotateCcw, Underline } from 'lucide-react'

const MARKS = [
  { id: 'bold', label: 'Bold', icon: Bold },
  { id: 'italic', label: 'Italic', icon: Italic },
  { id: 'underline', label: 'Underline', icon: Underline },
] as const

type MarkId = (typeof MARKS)[number]['id']

const INITIAL_MARKS: Record<MarkId, boolean> = { bold: true, italic: false, underline: false }

export default function SeparatorToolbar() {
  const [marks, setMarks] = useState(INITIAL_MARKS)

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-row" role="toolbar" aria-label="Text formatting">
        {MARKS.map((mark) => (
          <Button
            key={mark.id}
            size="icon-sm"
            variant={marks[mark.id] ? 'default' : 'ghost'}
            aria-label={mark.label}
            aria-pressed={marks[mark.id]}
            onClick={() => setMarks((current) => ({ ...current, [mark.id]: !current[mark.id] }))}
          >
            <mark.icon aria-hidden="true" />
          </Button>
        ))}
        <Separator orientation="vertical" style={{ height: 20 }} />
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label="Clear formatting"
          onClick={() => setMarks(INITIAL_MARKS)}
        >
          <RotateCcw aria-hidden="true" />
        </Button>
      </div>
      <p
        style={{
          margin: 0,
          fontWeight: marks.bold ? 600 : 400,
          fontStyle: marks.italic ? 'italic' : 'normal',
          textDecoration: marks.underline ? 'underline' : 'none',
        }}
      >
        Release notes are reviewed by the platform team before every deploy.
      </p>
      <p className="fish-demo-muted" style={{ margin: 0 }}>
        The separator is vertical and 20 px tall, set explicitly because the toolbar row has no
        resolved height for <code>h-full</code> to use.
      </p>
    </div>
  )
}
