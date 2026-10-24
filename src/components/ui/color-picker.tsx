import { ChevronsUpDown } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const HEX_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i
const DEFAULT_PRESETS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
  '#eab308',
  '#10b981',
  '#0ea5e9',
  '#64748b',
]

export function normalizeHex(value: string) {
  const text = value.startsWith('#') ? value : `#${value}`
  if (!HEX_PATTERN.test(text)) return null
  const raw = text.slice(1).toLowerCase()
  return raw.length === 3
    ? `#${raw
        .split('')
        .map((char) => char + char)
        .join('')}`
    : `#${raw}`
}

export function ColorPicker({
  id,
  value,
  defaultValue = '#6366f1',
  onValueChange,
  presets = DEFAULT_PRESETS,
  ariaLabel,
  hexLabel,
  pickerLabel,
  presetsLabel,
  disabled = false,
  className,
}: {
  id?: string
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  presets?: string[]
  ariaLabel: string
  hexLabel?: string
  pickerLabel?: string
  presetsLabel?: string
  disabled?: boolean
  className?: string
}) {
  const [internal, setInternal] = useState(() => normalizeHex(defaultValue) ?? '#6366f1')
  const color = normalizeHex(value ?? internal) ?? '#6366f1'
  const [draft, setDraft] = useState(color)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setDraft(color)
  }, [color])

  function commit(next: string) {
    const normalized = normalizeHex(next)
    if (!normalized) return false
    if (value === undefined) setInternal(normalized)
    setDraft(normalized)
    onValueChange?.(normalized)
    return true
  }

  function commitDraft() {
    if (!commit(draft)) setDraft(color)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          id={id}
          variant="outline"
          aria-label={`${ariaLabel}: ${color}`}
          disabled={disabled}
          className={cn('w-full justify-start gap-2 font-normal', className)}
        >
          <span
            aria-hidden
            className="size-4 shrink-0 rounded-sm border border-black/10"
            style={{ backgroundColor: color }}
          />
          <span className="font-mono text-xs uppercase">{color}</span>
          <ChevronsUpDown aria-hidden className="ml-auto size-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 space-y-3 p-3">
        <div className="flex items-center gap-2">
          <input
            type="color"
            aria-label={pickerLabel ?? ariaLabel}
            value={color}
            disabled={disabled}
            onChange={(event) => commit(event.target.value)}
            className="size-9 shrink-0 cursor-pointer rounded-md border bg-background p-0.5"
          />
          <Input
            value={draft}
            disabled={disabled}
            aria-label={hexLabel ?? ariaLabel}
            aria-invalid={!normalizeHex(draft) || undefined}
            spellCheck={false}
            className="h-9 font-mono text-xs"
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commitDraft}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                commitDraft()
              }
            }}
          />
        </div>
        <div
          role="group"
          aria-label={presetsLabel ?? ariaLabel}
          className="grid grid-cols-8 gap-1.5"
        >
          {presets.map((preset) => {
            const normalized = normalizeHex(preset)
            if (!normalized) return null
            return (
              <button
                key={preset}
                type="button"
                aria-label={preset}
                aria-pressed={normalized === color}
                disabled={disabled}
                onClick={() => commit(normalized)}
                className={cn(
                  'size-6 rounded-md border border-black/10 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
                  normalized === color && 'ring-2 ring-ring ring-offset-1',
                )}
                style={{ backgroundColor: normalized }}
              />
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
