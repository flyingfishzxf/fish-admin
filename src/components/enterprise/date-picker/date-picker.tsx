import { enUS, zhCN } from 'date-fns/locale'
import { CalendarDays } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Matcher } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatDayDisplay, formatDayValue, parseDay } from '@/lib/date'
import { cn } from '@/lib/utils'

export function DatePicker({
  value,
  onChange,
  placeholder,
  ariaLabel,
  min,
  max,
  disabled = false,
  className,
}: {
  value?: string
  onChange: (value: string | undefined) => void
  placeholder: string
  ariaLabel: string
  min?: string
  max?: string
  disabled?: boolean
  className?: string
}) {
  const { t, i18n } = useTranslation('common')
  const [open, setOpen] = useState(false)

  const selected = parseDay(value)
  const minimum = parseDay(min)
  const maximum = parseDay(max)
  const display = formatDayDisplay(value, i18n.language)
  const calendarLocale = (i18n.resolvedLanguage ?? i18n.language).startsWith('zh') ? zhCN : enUS

  const disabledDays: Matcher[] = []
  if (minimum) disabledDays.push({ before: minimum })
  if (maximum) disabledDays.push({ after: maximum })

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
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            onChange(date ? formatDayValue(date) : undefined)
            setOpen(false)
          }}
          locale={calendarLocale}
          disabled={disabledDays.length > 0 ? disabledDays : undefined}
          autoFocus
          className="p-0"
        />
        <div className="mt-2 flex justify-end border-t pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!value}
            onClick={() => {
              onChange(undefined)
              setOpen(false)
            }}
          >
            {t('enterprise.clear')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
