import { useState } from 'react'

import { Bold, Italic, Underline } from 'lucide-react'

import { Toggle } from '@fish-admin/react'

type Mark = 'bold' | 'italic' | 'underline'

const INITIAL_MARKS: Record<Mark, boolean> = {
  bold: true,
  italic: false,
  underline: false,
}

const MARKS: Mark[] = ['bold', 'italic', 'underline']

const ICONS: Record<Mark, typeof Bold> = {
  bold: Bold,
  italic: Italic,
  underline: Underline,
}

const LABELS: Record<Mark, string> = {
  bold: 'Bold',
  italic: 'Italic',
  underline: 'Underline',
}

export default function ToggleBasic() {
  const [marks, setMarks] = useState(INITIAL_MARKS)

  function toggle(mark: Mark) {
    setMarks((current) => ({ ...current, [mark]: !current[mark] }))
  }

  return (
    <div className="fish-demo-stack">
      <div className="fish-demo-row" role="toolbar" aria-label="Text formatting">
        {MARKS.map((mark) => {
          const Icon = ICONS[mark]
          return (
            <Toggle
              key={mark}
              pressed={marks[mark]}
              onPressedChange={() => toggle(mark)}
              aria-label={LABELS[mark]}
            >
              <Icon />
            </Toggle>
          )
        })}
      </div>
      <p
        style={{
          margin: 0,
          padding: '0.75rem',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          fontWeight: marks.bold ? 700 : 400,
          fontStyle: marks.italic ? 'italic' : 'normal',
          textDecoration: marks.underline ? 'underline' : 'none',
        }}
      >
        Design is how it works.
      </p>
      <p className="fish-demo-muted" style={{ margin: 0 }} aria-live="polite">
        {`Pressed: ${MARKS.filter((mark) => marks[mark]).join(', ') || 'none'}`}
      </p>
      <p className="fish-demo-muted" style={{ margin: 0 }}>
        Each toggle is its own tab stop. Pressing Space or Enter flips the icon button and updates
        the preview.
      </p>
    </div>
  )
}
