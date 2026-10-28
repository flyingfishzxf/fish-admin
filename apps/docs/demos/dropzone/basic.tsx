import { useState } from 'react'

import { Dropzone } from '@fish-admin/react'

export default function DropzoneBasic() {
  const [file, setFile] = useState<{ name: string; size: number } | null>(null)
  const [error, setError] = useState<string | undefined>()

  return (
    <div className="fish-demo-stack">
      <Dropzone
        accept=".csv"
        label="Drop the member import here"
        hint="One CSV file, up to 5 MB. Export the template first so the headers match."
        browseLabel="Choose a CSV"
        error={error}
        onFiles={(files) => {
          const [first] = files
          if (!first) return
          if (!first.name.toLowerCase().endsWith('.csv')) {
            setFile(null)
            setError('That file is not a CSV. Export the template and try again.')
            return
          }
          setError(undefined)
          setFile({ name: first.name, size: Math.max(1, Math.round(first.size / 1024)) })
        }}
      />
      {file ? (
        <p className="fish-demo-muted" aria-live="polite">
          Ready to import {file.name} · {file.size} KB
        </p>
      ) : (
        <p className="fish-demo-muted">Nothing queued yet.</p>
      )}
      <p className="fish-demo-muted" style={{ margin: 0 }}>
        <code>accept</code> filters the native file dialog only. Dropped files bypass it, which is
        why the demo checks the extension before accepting the drop.
      </p>
    </div>
  )
}
