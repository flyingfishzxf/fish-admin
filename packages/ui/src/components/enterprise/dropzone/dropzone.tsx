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
  onFile?: (file: File) => void
  onFiles?: (files: File[]) => void
  multiple?: boolean
  accept?: string
  label: string
  hint?: string
  browseLabel?: string
  disabled?: boolean
  error?: string
  preview?: ReactNode
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
