import { UploadCloud } from 'lucide-react'
import { useId, useRef, useState, type DragEvent, type ReactNode } from 'react'
import { useUITranslation } from '../../../i18n'

import { Button } from '../../ui/button'
import { cn } from '../../../lib/utils'

export function Dropzone({
  onFile,
  onFiles,
  multiple = false,
  accept,
  label,
  hint,
  browseLabel,
  disabled = false,
  error,
  preview,
  className,
}: {
  /** Receives the first dropped or picked file when `onFiles` is absent. */
  onFile?: (file: File) => void
  /** Receives every file at once; takes precedence over `onFile`. */
  onFiles?: (files: File[]) => void
  /** Allows picking and dropping more than one file. */
  multiple?: boolean
  /** Native accept hint, for example `.csv,.tsv`; drag and drop is not filtered by it. */
  accept?: string
  /** Primary instruction and accessible name of the hidden file input. */
  label: string
  /** Secondary line under the label, for format and size limits. */
  hint?: string
  /** Text of the browse button; defaults to "Browse files". */
  browseLabel?: string
  /** Disables dragging, the input and the browse button. */
  disabled?: boolean
  /** Validation message rendered with `role="alert"` under the button. */
  error?: string
  /** Content rendered above the icon, for thumbnails or a file summary. */
  preview?: ReactNode
  /** Extra classes for the dashed drop area. */
  className?: string
}) {
  const { t } = useUITranslation()
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const dragDepth = useRef(0)
  const [dragging, setDragging] = useState(false)

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (disabled) return
    dragDepth.current += 1
    setDragging(true)
  }

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    dragDepth.current = Math.max(0, dragDepth.current - 1)
    if (dragDepth.current === 0) setDragging(false)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    dragDepth.current = 0
    setDragging(false)
    if (disabled) return

    const files = Array.from(event.dataTransfer.files ?? [])
    if (files.length === 0) return
    if (onFiles) onFiles(files)
    else onFile?.(files[0]!)
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      aria-disabled={disabled || undefined}
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-8 text-center transition-colors',
        dragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/30',
        disabled && 'opacity-60',
        className,
      )}
    >
      {preview}
      <span className="flex size-10 items-center justify-center rounded-full bg-background text-muted-foreground">
        <UploadCloud className="size-5" />
      </span>
      <p className="text-sm font-medium">{label}</p>
      {hint ? <p className="max-w-xs text-xs text-muted-foreground">{hint}</p> : null}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        aria-label={label}
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? [])
          if (files.length > 0) {
            if (onFiles) onFiles(files)
            else onFile?.(files[0]!)
          }
          event.target.value = ''
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        {browseLabel ?? t('enterprise.browse')}
      </Button>
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
