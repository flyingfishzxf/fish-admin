import { Check, ChevronsUpDown, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export type ComboboxOption = {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

export function Combobox({
  id,
  options,
  value,
  onChange,
  onClear,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  ariaLabel,
  clearLabel,
  disabled = false,
  className,
}: {
  id?: string
  options: ComboboxOption[]
  value?: string | null
  onChange: (value: string) => void
  onClear?: () => void
  placeholder: string
  searchPlaceholder?: string
  emptyLabel?: string
  ariaLabel: string
  clearLabel?: string
  disabled?: boolean
  className?: string
}) {
  const { t } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.value === value)

  return (
    <div className={cn('relative', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            id={id}
            variant="outline"
            role="combobox"
            aria-label={ariaLabel}
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'w-full justify-between gap-2 pr-14 font-normal',
              !selected && 'text-muted-foreground',
            )}
          >
            <span className="truncate">{selected?.label ?? placeholder}</span>
            <ChevronsUpDown className="size-4 shrink-0 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-(--radix-popover-trigger-width) min-w-56 p-0">
          <Command>
            <CommandInput placeholder={searchPlaceholder ?? t('enterprise.search')} />
            <CommandList>
              <CommandEmpty>{emptyLabel ?? t('enterprise.noMatches')}</CommandEmpty>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.description ?? ''}`}
                  disabled={option.disabled}
                  onSelect={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                >
                  <Check
                    aria-hidden
                    className={cn('size-4', option.value === value ? 'opacity-100' : 'opacity-0')}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{option.label}</span>
                    {option.description ? (
                      <span className="block truncate text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    ) : null}
                  </span>
                </CommandItem>
              ))}
            </CommandList>
          </Command>
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
