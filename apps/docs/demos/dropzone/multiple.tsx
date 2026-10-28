import { useState } from 'react'

import { Button, Dropzone } from '@fish-admin/react'

type PickedFile = { id: string; name: string; size: number }

const ACCEPTED = ['.png', '.jpg', '.jpeg']

export default function DropzoneMultiple() {
  const [files, setFiles] = useState<PickedFile[]>([])
  const [error, setError] = useState<string | undefined>()

  return (
    <div className="fish-demo-stack">
      <Dropzone
        multiple
        accept={ACCEPTED.join(',')}
        label="Drop brand assets here"
        hint="PNG or JPEG, several files at once. Each file becomes one attachment."
        browseLabel="Choose files"
        error={error}
        onFiles={(incoming) => {
          const rejected = incoming.filter(
            (file) => !ACCEPTED.some((extension) => file.name.toLowerCase().endsWith(extension)),
          )
          if (rejected.length > 0) {
            setError(`${rejected[0]?.name} is not a PNG or JPEG.`)
            return
          }
          setError(undefined)
          setFiles((current) => [
            ...current,
            ...incoming.map((file, index) => ({
              id: `${file.name}-${file.size}-${current.length + index}`,
              name: file.name,
              size: Math.max(1, Math.round(file.size / 1024)),
            })),
          ])
        }}
      />
      {files.length > 0 ? (
        <>
          <ul
            aria-label="Attached brand assets"
            style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.85rem' }}
          >
            {files.map((file) => (
              <li key={file.id}>
                {file.name} · {file.size} KB
              </li>
            ))}
          </ul>
          <div className="fish-demo-row">
            <Button variant="outline" size="sm" onClick={() => setFiles([])}>
              Clear all
            </Button>
            <span className="fish-demo-muted">
              {files.length} file{files.length === 1 ? '' : 's'} queued for upload
            </span>
          </div>
        </>
      ) : (
        <p className="fish-demo-muted">No assets queued. Uploads start when you save the draft.</p>
      )}
      <p className="fish-demo-muted" style={{ margin: 0 }}>
        With <code>multiple</code>, every callback arrives through <code>onFiles</code> as an array;
        if you omit <code>onFiles</code>, <code>onFile</code> receives only the first file.
      </p>
    </div>
  )
}
