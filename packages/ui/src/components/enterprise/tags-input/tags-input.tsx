import { X } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'
import { useUITranslation } from '../../../i18n'

import { Badge } from '../../ui/badge'
import { cn } from '../../../lib/utils'

export function TagsInput({
  id,
  name,
  value,
  onChange,
  placeholder,
  ariaLabel,
  maxTags = 8,
  maxLength = 24,
  disabled = false,
  suggestions,
  className,
}: {
  id?: string
  name?: string
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  ariaLabel: string
  maxTags?: number
  maxLength?: number
  disabled?: boolean
  suggestions?: { label: string; value: string }[]
  className?: string
}) {
  const { t } = useUITranslation()
  const [draft, setDraft] = useState('')
  const atLimit = value.length >= maxTags

  const commit = (raw: string) => {
    const next = [...value]

    for (const part of raw.split(',')) {
      const tag = part.trim().slice(0, maxLength)
      if (tag && !next.includes(tag) && next.length < maxTags) next.push(tag)
    }

    if (next.length !== value.length) onChange(next)
    setDraft('')
  }

  const remove = (tag: string) => {
    onChange(value.filter((item) => item !== tag))
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      if (draft.trim()) commit(draft)
      return
    }

    if (event.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1))
      return
    }

    if (event.key === 'Escape') setDraft('')
  }

  return (
    <div
      className={cn(
        'flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1.5 shadow-xs transition-shadow focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      {value.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1 py-0.5 pr-1">
          <span className="max-w-40 truncate">{tag}</span>
          <button
            type="button"
            aria-label={t('enterprise.removeTag', { tag })}
            disabled={disabled}
            onClick={() => remove(tag)}
            className="rounded-full p-0.5 outline-none hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      <input
        id={id}
        name={name}
        value={draft}
        disabled={disabled || atLimit}
        aria-label={ariaLabel}
        placeholder={value.length === 0 ? placeholder : undefined}
        onChange={(event) => {
          const next = event.target.value
          if (next.includes(',')) commit(next)
          else setDraft(next)
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (draft.trim()) commit(draft)
        }}
        className="h-6 min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
      />
      {suggestions && suggestions.length > 0 ? (
        <div className="mt-0.5 flex w-full flex-wrap items-center gap-1 border-t pt-1.5">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.value}
              type="button"
              disabled={disabled || atLimit}
              aria-label={t('enterprise.suggestedTag', { tag: suggestion.label })}
              onClick={() => commit(suggestion.value)}
              className="rounded-full border border-dashed px-2 py-0.5 text-xs text-muted-foreground outline-none hover:border-primary/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
            >
              + {suggestion.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
