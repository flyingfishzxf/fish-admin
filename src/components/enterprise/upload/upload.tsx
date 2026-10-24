import { CheckCircle2, FileText, RotateCcw, TriangleAlert, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Dropzone } from '@/components/enterprise/dropzone/dropzone'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

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
  items: UploadItem[]
  onFiles: (files: File[]) => void
  onRemove?: (item: UploadItem) => void
  onRetry?: (item: UploadItem) => void
  accept?: string
  label: string
  hint?: string
  browseLabel?: string
  maxSize?: number
  maxSizeLabel?: string
  removeLabel?: (item: UploadItem) => string
  retryLabel?: string
  disabled?: boolean
  className?: string
}) {
  const { t } = useTranslation('common')
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
