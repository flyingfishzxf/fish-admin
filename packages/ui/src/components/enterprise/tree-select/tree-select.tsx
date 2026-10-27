import { ChevronDown, X } from 'lucide-react'
import type { AriaAttributes } from 'react'
import { useMemo, useState } from 'react'
import { useUITranslation } from '../../../i18n'

import { Button } from '../../ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover'
import { treePath } from '../../../lib/tree'
import { cn } from '../../../lib/utils'

import { Tree, type TreeItem } from '../tree/tree'

export function TreeSelect({
  id,
  items,
  value,
  onChange,
  onClear,
  placeholder,
  ariaLabel,
  clearLabel,
  emptyLabel,
  disabled,
  className,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}: {
  id?: string
  items: TreeItem[]
  value?: string | null
  onChange: (id: string) => void
  onClear?: () => void
  placeholder: string
  ariaLabel: string
  clearLabel?: string
  emptyLabel?: string
  disabled?: boolean
  className?: string
  'aria-invalid'?: AriaAttributes['aria-invalid']
  'aria-describedby'?: string
}) {
  const { t } = useUITranslation()
  const [open, setOpen] = useState(false)
  const selectedLabel = useMemo(() => {
    if (!value) return undefined
    const path = treePath(items, value)
    return path.length > 0 ? path.map((item) => item.label).join(' / ') : undefined
  }, [items, value])

  return (
    <div className={cn('relative', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            id={id}
            variant="outline"
            aria-label={`${ariaLabel}: ${selectedLabel ?? placeholder}`}
            aria-expanded={open}
            aria-invalid={ariaInvalid}
            aria-describedby={ariaDescribedBy}
            disabled={disabled}
            className={cn(
              'w-full justify-between gap-2 pr-14 font-normal',
              !selectedLabel && 'text-muted-foreground',
            )}
          >
            <span className="truncate">{selectedLabel ?? placeholder}</span>
            <ChevronDown className="size-4 shrink-0 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 max-w-[calc(100vw-2rem)] p-1">
          <Tree
            items={items}
            selectedId={value}
            ariaLabel={ariaLabel}
            emptyLabel={emptyLabel}
            className="max-h-72 overflow-y-auto p-1"
            onSelect={(id) => {
              onChange(id)
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
      {value && onClear ? (
        <button
          type="button"
          aria-label={clearLabel ?? t('enterprise.clearSelection')}
          disabled={disabled}
          onClick={onClear}
          className="absolute top-1/2 right-8 z-10 flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  )
}
