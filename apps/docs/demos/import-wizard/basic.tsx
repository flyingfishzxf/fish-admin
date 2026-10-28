import { useEffect, useRef, useState } from 'react'

import { ImportWizard, type ImportField, type ImportWizardLabels } from '@fish-admin/react'

const FIELDS: ImportField[] = [
  { key: 'name', label: 'Member name', required: true, aliases: ['full name'] },
  { key: 'email', label: 'Work email', required: true, type: 'email', aliases: ['e-mail'] },
  { key: 'team', label: 'Team', aliases: ['department'] },
]

const SAMPLE_CSV = `Name,Email,Team
Ada Lovelace,ada@acme.dev,Engineering
Grace Hopper,grace@acme.dev,Research
Katherine Johnson,katherine@acme.dev,Navigation`

const LABELS: ImportWizardLabels = {
  steps: ['Upload', 'Map columns', 'Review', 'Done'],
  dropTitle: 'Drop a CSV here',
  dropHint: 'One file with a header row. Nothing leaves the browser in this demo.',
  browse: 'Choose a file',
  sample: 'Load sample',
  emptyFile: 'That file has no data rows.',
  parseError: 'The file could not be read.',
  mapTitle: 'Match columns to fields',
  mapHint: 'Header names are matched automatically when they are close enough.',
  sourceColumn: 'Source column',
  skipColumn: 'Do not import',
  previewTitle: 'First three rows',
  mapRequired: (names) => `Map these required fields before continuing: ${names}.`,
  reviewTitle: 'Review the parsed rows',
  reviewHint: 'Rows with errors are listed but never imported.',
  validCount: (count) => `${count} row${count === 1 ? '' : 's'} ready`,
  invalidCount: (count) => `${count} row${count === 1 ? '' : 's'} skipped`,
  rowNumber: 'Line',
  status: 'Result',
  statusValid: 'Ready',
  statusInvalid: 'Skipped',
  back: 'Back',
  next: 'Next',
  import: (count) => `Import ${count} row${count === 1 ? '' : 's'}`,
  importing: 'Importing…',
  importFailed: 'The import service rejected the batch.',
  doneTitle: 'Import finished',
  doneHint: (count) => `${count} row${count === 1 ? '' : 's'} were written to the member list.`,
  reset: 'Import another file',
  messages: {
    required: (label) => `${label} is missing`,
    email: (label) => `${label} is not an email address`,
    number: (label) => `${label} must be a number`,
  },
}

export default function ImportWizardBasic() {
  const [imported, setImported] = useState<number | null>(null)
  const timers = useRef<number[]>([])

  useEffect(
    () => () => {
      for (const timer of timers.current) window.clearTimeout(timer)
      timers.current = []
    },
    [],
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
      <ImportWizard
        fields={FIELDS}
        labels={LABELS}
        sample={SAMPLE_CSV}
        sampleName="members.csv"
        ariaLabel="Member CSV import"
        onImport={async (rows) =>
          new Promise<void>((resolve) => {
            const timer = window.setTimeout(() => {
              setImported(rows.length)
              resolve()
            }, 500)
            timers.current.push(timer)
          })
        }
      />
      <p className="fish-demo-muted" role="status" style={{ margin: 0 }}>
        {imported === null
          ? 'Start with Load sample: the step rail above the panel marks the active step with aria-current="step".'
          : `${imported} rows reached onImport, then the wizard moved to Done on its own.`}
      </p>
    </div>
  )
}
