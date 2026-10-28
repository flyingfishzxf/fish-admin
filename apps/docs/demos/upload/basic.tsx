import { useEffect, useRef, useState } from 'react'

import { Upload, type UploadItem } from '@fish-admin/react'

export default function UploadBasic() {
  const [items, setItems] = useState<UploadItem[]>([
    { id: 'report', name: 'quarterly-report.pdf', size: 1_480_000, status: 'done', progress: 100 },
  ])
  const nextId = useRef(0)

  const hasUploading = items.some((item) => item.status === 'uploading')

  useEffect(() => {
    if (!hasUploading) return
    const timer = setInterval(() => {
      setItems((current) =>
        current.map((item) => {
          if (item.status !== 'uploading') return item
          const next = Math.min(100, (item.progress ?? 0) + 20)
          return next >= 100
            ? { ...item, progress: 100, status: 'done' }
            : { ...item, progress: next }
        }),
      )
    }, 350)
    return () => clearInterval(timer)
  }, [hasUploading])

  const uploadingCount = items.filter((item) => item.status === 'uploading').length

  return (
    <div className="fish-demo-stack">
      <Upload
        items={items}
        label="Drop the export or browse"
        hint="Attach the report files. This demo simulates the transfer; nothing is uploaded."
        browseLabel="Choose files"
        removeLabel={(item) => `Remove ${item.name}`}
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
      />
      <p className="fish-demo-muted" aria-live="polite" style={{ margin: 0 }}>
        {uploadingCount > 0
          ? `${uploadingCount} file${uploadingCount === 1 ? '' : 's'} transferring…`
          : `${items.length} file${items.length === 1 ? '' : 's'} ready in the queue.`}
      </p>
    </div>
  )
}
