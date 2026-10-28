import { ChevronDown, ChevronRight, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useUITranslation } from '../../../i18n'

import { Button } from '../../ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover'
import { cn } from '../../../lib/utils'

export type CascaderOption = {
  value: string
  label: string
  children?: CascaderOption[]
  disabled?: boolean
}

function findPath(options: CascaderOption[], path: string[]) {
  const trail: CascaderOption[] = []
  let level = options

  for (const value of path) {
    const match = level.find((option) => option.value === value)
    if (!match) break
    trail.push(match)
    level = match.children ?? []
  }

  return trail
}

export function Cascader({
  options,
  value = [],
  onChange,
  onClear,
  placeholder,
  ariaLabel,
  clearLabel,
  emptyLabel,
  disabled = false,
  className,
}: {
  /** Root level of the tree; each level is one column. */
  options: CascaderOption[]
  /** Controlled path of option values from root to leaf. */
  value?: string[]
  /** Called with the full path when a leaf is picked. */
  onChange: (value: string[]) => void
  /** Shows the clear affordance when provided and a value is set. */
  onClear?: () => void
  /** Trigger text when nothing is selected. */
  placeholder: string
  /** Accessible name for the trigger and each column. */
  ariaLabel: string
  /** Accessible name of the clear button. */
  clearLabel?: string
  /** Copy for the popover when options is empty. */
  emptyLabel?: string
  disabled?: boolean
  className?: string
}) {
  const { t } = useUITranslation()
  const [open, setOpen] = useState(false)
  const [activePath, setActivePath] = useState<string[]>(value)
  const trail = useMemo(() => findPath(options, activePath), [options, activePath])
  const selectedTrail = useMemo(() => findPath(options, value), [options, value])
  const columns = useMemo(() => {
    const result: CascaderOption[][] = [options]
    for (const option of trail) {
      if (option.children?.length) result.push(option.children)
    }
    return result
  }, [options, trail])

  const label = selectedTrail.map((option) => option.label).join(' / ')

  const select = (depth: number, option: CascaderOption) => {
    if (option.disabled) return
    const prefix = activePath.slice(0, depth)
    const nextPath = [...prefix, option.value]
    setActivePath(nextPath)

    if (option.children?.length) return
    onChange(nextPath)
    setOpen(false)
  }

  return (
    <div className={cn('relative', className)}>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (next) setActivePath(value)
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            aria-label={`${ariaLabel}: ${label || placeholder}`}
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'w-full justify-between gap-2 pr-14 font-normal',
              !label && 'text-muted-foreground',
            )}
          >
            <span className="truncate">{label || placeholder}</span>
            <ChevronDown className="size-4 shrink-0 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto max-w-[calc(100vw-2rem)] p-1">
          {options.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {emptyLabel ?? t('enterprise.noMatches')}
            </p>
          ) : (
            <div className="flex">
              {columns.map((column, depth) => (
                <ul
                  key={depth}
                  aria-label={`${ariaLabel} ${depth + 1}`}
                  className="max-h-64 w-44 overflow-y-auto border-r p-1 last:border-r-0"
                >
                  {column.map((option) => {
                    const selected = activePath[depth] === option.value
                    const hasChildren = Boolean(option.children?.length)

                    return (
                      <li key={option.value}>
                        <button
                          type="button"
                          aria-pressed={selected}
                          disabled={option.disabled}
                          onClick={() => select(depth, option)}
                          className={cn(
                            'flex w-full items-center gap-1.5 rounded-sm px-2 py-1.5 text-left text-sm transition-colors outline-none hover:bg-accent focus-visible:bg-accent disabled:cursor-not-allowed disabled:opacity-50',
                            selected && 'bg-primary/10 font-medium text-accent-foreground',
                          )}
                        >
                          <span className="min-w-0 flex-1 truncate">{option.label}</span>
                          {hasChildren ? (
                            <ChevronRight aria-hidden className="size-3.5 shrink-0 opacity-60" />
                          ) : selected ? (
                            <span aria-hidden className="size-1.5 rounded-full bg-primary" />
                          ) : null}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>
      {value.length > 0 && onClear ? (
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
