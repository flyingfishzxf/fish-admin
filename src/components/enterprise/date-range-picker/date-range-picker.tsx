import { CalendarDays } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { DateRange as DayPickerRange } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface DateRangeValue {
  from?: string
  to?: string
}

export interface DateRangePreset extends DateRangeValue {
  label: string
}

function parseDay(value?: string) {
  if (!value) return undefined
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return undefined

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(date.getTime()) ? undefined : date
}

function formatDayValue(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function DateRangePicker({
  value,
  onChange,
  placeholder,
  ariaLabel,
  presets,
  disabled,
  className,
}: {
  value: DateRangeValue
  onChange: (value: DateRangeValue) => void
  placeholder: string
  ariaLabel: string
  presets?: DateRangePreset[]
  disabled?: boolean
  className?: string
}) {
  const { t, i18n } = useTranslation('common')
  const [open, setOpen] = useState(false)

  const from = parseDay(value.from)
  const to = parseDay(value.to)
  const selected: DayPickerRange | undefined = from || to ? { from, to } : undefined
  const formatter = new Intl.DateTimeFormat(i18n.language, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const display = from
    ? to
      ? `${formatter.format(from)} – ${formatter.format(to)}`
      : `${formatter.format(from)} – …`
    : to
      ? `… – ${formatter.format(to)}`
      : undefined

  const hasValue = Boolean(value.from || value.to)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label={ariaLabel}
          disabled={disabled}
          className={cn(
            'justify-start gap-2 font-normal',
            !display && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarDays className="size-4 shrink-0" />
          <span className="truncate">{display ?? placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto max-w-[calc(100vw-2rem)] p-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          {presets && presets.length > 0 ? (
            <div className="flex shrink-0 flex-row gap-1 overflow-x-auto sm:w-36 sm:flex-col sm:overflow-visible sm:border-r sm:pr-3">
              {presets.map((preset) => {
                const active = preset.from === value.from && preset.to === value.to
                return (
                  <Button
                    key={preset.label}
                    type="button"
                    variant={active ? 'secondary' : 'ghost'}
                    size="sm"
                    className="justify-start whitespace-nowrap"
                    onClick={() => {
                      onChange({ from: preset.from, to: preset.to })
                      setOpen(false)
                    }}
                  >
                    {preset.label}
                  </Button>
                )
              })}
            </div>
          ) : null}
          <div className="min-w-0">
            <Calendar
              mode="range"
              numberOfMonths={1}
              selected={selected}
              onSelect={(range) => {
                onChange({
                  from: range?.from ? formatDayValue(range.from) : undefined,
                  to: range?.to ? formatDayValue(range.to) : undefined,
                })
              }}
              autoFocus
              className="p-0"
            />
            <div className="mt-2 flex justify-end border-t pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!hasValue}
                onClick={() => {
                  onChange({})
                  setOpen(false)
                }}
              >
                {t('enterprise.clear')}
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
