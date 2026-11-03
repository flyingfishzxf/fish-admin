import { X } from 'lucide-react'
import type { ReactNode } from 'react'

import { Badge } from '../../ui/badge'
import { Button } from '../../ui/button'

export function BulkActionsBar({
  label,
  regionLabel,
  clearLabel,
  onClear,
  children,
}: {
  label: string
  regionLabel?: string
  clearLabel: string
  onClear: () => void
  children?: ReactNode
}) {
  return (
    <div
      data-slot="bulk-actions-bar"
      role="region"
      aria-label={regionLabel ?? label}
      className="fixed inset-x-0 bottom-6 z-40 mx-auto flex w-fit max-w-[calc(100vw-2rem)] flex-wrap items-center justify-center gap-2 rounded-2xl border bg-background/95 px-3 py-2 shadow-xl backdrop-blur sm:rounded-full"
    >
      <Badge variant="secondary" className="rounded-full px-2.5 font-normal">
        {label}
      </Badge>
      {children}
      <Button variant="ghost" size="icon-sm" aria-label={clearLabel} onClick={onClear}>
        <X className="size-4" />
      </Button>
    </div>
  )
}
