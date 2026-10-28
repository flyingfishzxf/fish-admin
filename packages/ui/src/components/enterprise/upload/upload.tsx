import { CheckCircle2, FileText, RotateCcw, TriangleAlert, X } from 'lucide-react'
import { useState } from 'react'
import { useUITranslation } from '../../../i18n'

import { Dropzone } from '../dropzone/dropzone'
import { Button } from '../../ui/button'
import { Progress } from '../../ui/progress'
import { cn } from '../../../lib/utils'

export type UploadItem = {
  id: string
  name: string
  size: number
  status?: 'uploading' | 'done' | 'error'
  progress?: number
  error?: string
}

function formatSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value)} ${units[exponent]}`
}

export function Upload({
  items,
  onFiles,
  onRemove,
  onRetry,
  accept,
  label,
  hint,
  browseLabel,
  maxSize,
  maxSizeLabel,
  removeLabel,
  retryLabel,
  disabled = false,
  className,
}: {
  /** The file rows to render, each carrying name, size and an optional status, progress or error. */
  items: UploadItem[]
  /** Called with the accepted files that pass the size check, straight from the dropzone. */
  onFiles: (files: File[]) => void
  /** When provided, every row gets a remove button that calls this with the row. */
  onRemove?: (item: UploadItem) => void
  /** When provided, error rows get a retry button that calls this with the row. */
  onRetry?: (item: UploadItem) => void
  /** Native accept hint for the browse dialog; drag and drop is not filtered by it. */
  accept?: string
  /** Primary instruction and accessible name of the hidden file input. */
  label: string
  /** Secondary line under the label, for format and size guidance. */
  hint?: string
  /** Text of the browse button; falls back to the translated default. */
  browseLabel?: string
  /** Per-file byte ceiling; larger picks are blocked before onFiles runs. */
  maxSize?: number
  /** Message surfaced as an alert when a file exceeds maxSize. */
  maxSizeLabel?: string
  /** Builds the accessible name of each remove button from the row. */
  removeLabel?: (item: UploadItem) => string
  /** Accessible name of the retry button on an error row. */
  retryLabel?: string
  /** Blocks dragging, the file input and the browse button. */
  disabled?: boolean
  /** Extra classes for the outer stack wrapper. */
  className?: string
}) {
  const { t } = useUITranslation()
  const [error, setError] = useState<string>()

  const handleFiles = (files: File[]) => {
    if (maxSize) {
      const oversized = files.filter((file) => file.size > maxSize)
      if (oversized.length > 0) {
        setError(maxSizeLabel ?? `Files must be ${formatSize(maxSize)} or smaller.`)
        return
      }
    }

    setError(undefined)
    onFiles(files)
  }

  return (
    <div data-slot="upload" className={cn('space-y-3', className)}>
      <Dropzone
        multiple
        onFiles={handleFiles}
        accept={accept}
        label={label}
        hint={hint}
        browseLabel={browseLabel}
        disabled={disabled}
        error={error}
      />
      {items.length > 0 ? (
        <ul className="divide-y rounded-lg border">
          {items.map((item) => {
            const status = item.status ?? 'done'

            return (
              <li key={item.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <FileText aria-hidden className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {formatSize(item.size)}
                    </span>
                  </div>
                  {status === 'uploading' ? (
                    <div className="mt-1.5 flex items-center gap-2">
                      <Progress
                        value={item.progress ?? 0}
                        aria-label={item.name}
                        className="h-1.5"
                      />
                      <span className="w-9 text-right text-[11px] text-muted-foreground tabular-nums">
                        {item.progress ?? 0}%
                      </span>
                    </div>
                  ) : status === 'error' ? (
                    <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                      <TriangleAlert aria-hidden className="size-3" />
                      {item.error ?? t('enterprise.noData')}
                    </p>
                  ) : (
                    <p className="mt-1 flex items-center gap-1 text-xs text-success">
                      <CheckCircle2 aria-hidden className="size-3" />
                      {item.progress === 100 ? '100%' : null}
                    </p>
                  )}
                </div>
                {status === 'error' && onRetry ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={retryLabel ?? t('actions.retry')}
                    onClick={() => onRetry(item)}
                  >
                    <RotateCcw aria-hidden />
                  </Button>
                ) : null}
                {onRemove ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={
                      removeLabel?.(item) ?? t('enterprise.removeFile', { name: item.name })
                    }
                    onClick={() => onRemove(item)}
                  >
                    <X aria-hidden />
                  </Button>
                ) : null}
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
