import { useEffect, useRef, useState } from 'react'

import { Upload, type UploadItem } from '@fish-admin/react'

const MAX_SIZE = 2_000_000

export default function UploadProgress() {
  const [items, setItems] = useState<UploadItem[]>([
    {
      id: 'assets',
      name: 'brand-assets.zip',
      size: 8_200_000,
      status: 'error',
      error: 'Connection reset by the upload endpoint.',
    },
  ])
  const nextId = useRef(0)

  const hasUploading = items.some((item) => item.status === 'uploading')

  useEffect(() => {
    if (!hasUploading) return
    const timer = setInterval(() => {
      setItems((current) =>
        current.map((item) => {
          if (item.status !== 'uploading') return item
          const next = Math.min(100, (item.progress ?? 0) + 25)
          return next >= 100
            ? { ...item, progress: 100, status: 'done', error: undefined }
            : { ...item, progress: next }
        }),
      )
    }, 300)
    return () => clearInterval(timer)
  }, [hasUploading])

  return (
    <div className="fish-demo-stack">
      <Upload
        items={items}
        label="Drop attachments"
        hint="Anything over 2 MB is rejected before it joins the queue."
        browseLabel="Choose files"
        accept=".pdf,.zip,.png"
        maxSize={MAX_SIZE}
        maxSizeLabel="Each file must be 2 MB or smaller."
        removeLabel={(item) => `Remove ${item.name}`}
        retryLabel="Retry this upload"
        onFiles={(files) =>
          setItems((current) => [
            ...current,
            ...files.map((file): UploadItem => ({
              id: `pick-${(nextId.current += 1)}`,
              name: file.name,
              size: file.size,
              status: 'uploading',
              progress: 0,
            })),
          ])
        }
        onRemove={(item) => setItems((current) => current.filter((entry) => entry.id !== item.id))}
        onRetry={(item) =>
          setItems((current) =>
            current.map((entry): UploadItem =>
              entry.id === item.id
                ? { ...entry, status: 'uploading', progress: 0, error: undefined }
                : entry,
            ),
          )
        }
      />
      <p className="fish-demo-muted" style={{ margin: 0 }}>
        Retrying the failed row flips it back to <code>uploading</code> and the same effect timer
        advances it to 100 %. An oversize pick never reaches <code>onFiles</code>: the dropzone
        shows the <code>maxSizeLabel</code> as a <code>role="alert"</code> instead.
      </p>
    </div>
  )
}
