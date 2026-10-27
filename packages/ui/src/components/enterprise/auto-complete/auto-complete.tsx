import { useId, useMemo, useState, type KeyboardEvent } from 'react'

import { Input } from '../../ui/input'
import { Popover, PopoverAnchor, PopoverContent } from '../../ui/popover'
import { cn } from '../../../lib/utils'

export type AutoCompleteOption = {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

export function AutoComplete({
  id,
  options,
  value,
  onValueChange,
  onSelect,
  placeholder,
  ariaLabel,
  emptyLabel,
  loading = false,
  loadingLabel,
  disabled = false,
  openOnFocus = true,
  className,
}: {
  id?: string
  options: AutoCompleteOption[]
  value: string
  onValueChange: (value: string) => void
  onSelect?: (option: AutoCompleteOption) => void
  placeholder?: string
  ariaLabel: string
  emptyLabel?: string
  loading?: boolean
  loadingLabel?: string
  disabled?: boolean
  openOnFocus?: boolean
  className?: string
}) {
  const listId = useId()
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const filtered = useMemo(() => {
    const query = value.trim().toLowerCase()
    if (!query) return options
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        option.description?.toLowerCase().includes(query),
    )
  }, [options, value])

  const activeOption = filtered[activeIndex]

  function selectOption(option: AutoCompleteOption) {
    if (option.disabled) return
    onValueChange(option.label)
    onSelect?.(option)
    setOpen(false)
    setActiveIndex(-1)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((current) => Math.min(current + 1, filtered.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => Math.max(current - 1, 0))
    } else if (event.key === 'Enter') {
      if (open && activeOption) {
        event.preventDefault()
        selectOption(activeOption)
      }
    } else if (event.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
    } else if (event.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <Popover
      open={open && !disabled}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setActiveIndex(-1)
      }}
    >
      <PopoverAnchor asChild>
        <Input
          id={id}
          type="text"
          role="combobox"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-expanded={open && !disabled}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && activeOption ? `${listId}-option-${activeIndex}` : undefined
          }
          autoComplete="off"
          spellCheck={false}
          className={cn('w-full', className)}
          onChange={(event) => {
            onValueChange(event.target.value)
            setOpen(true)
            setActiveIndex(-1)
          }}
          onFocus={() => {
            if (openOnFocus) setOpen(true)
          }}
          onKeyDown={handleKeyDown}
        />
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) min-w-56 p-1"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <ul id={listId} role="listbox" aria-label={ariaLabel} className="max-h-64 overflow-y-auto">
          {loading ? (
            <li role="presentation" className="px-3 py-6 text-center text-sm text-muted-foreground">
              {loadingLabel}
            </li>
          ) : filtered.length === 0 ? (
            <li role="presentation" className="px-3 py-6 text-center text-sm text-muted-foreground">
              {emptyLabel}
            </li>
          ) : (
            filtered.map((option, index) => (
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- the combobox input owns keyboard navigation
              <li
                key={option.value}
                id={`${listId}-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                aria-disabled={option.disabled || undefined}
                className={cn(
                  'cursor-pointer rounded-sm px-3 py-2 text-sm outline-none',
                  index === activeIndex && 'bg-accent text-accent-foreground',
                  option.disabled && 'cursor-not-allowed opacity-50',
                )}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectOption(option)}
              >
                <span className="block truncate font-medium">{option.label}</span>
                {option.description ? (
                  <span className="block truncate text-xs text-muted-foreground">
                    {option.description}
                  </span>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
