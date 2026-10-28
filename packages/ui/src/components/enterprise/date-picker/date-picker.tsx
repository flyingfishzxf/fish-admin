import { enUS, zhCN } from 'date-fns/locale'
import { CalendarDays } from 'lucide-react'
import { useState } from 'react'
import { useUITranslation } from '../../../i18n'
import type { Matcher } from 'react-day-picker'

import { Button } from '../../ui/button'
import { Calendar } from '../../ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover'
import { formatDayDisplay, formatDayValue, parseDay } from '../../../lib/date'
import { cn } from '../../../lib/utils'

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
  /** Selected day as a `YYYY-MM-DD` string. */
  value?: string
  /** Called with the `YYYY-MM-DD` value, or `undefined` when cleared. */
  onChange: (value: string | undefined) => void
  /** Trigger text shown while no date is selected. */
  placeholder: string
  /** Accessible name; the current display value is appended to it. */
  ariaLabel: string
  /** Earliest selectable day as `YYYY-MM-DD`; earlier days are disabled. */
  min?: string
  /** Latest selectable day as `YYYY-MM-DD`; later days are disabled. */
  max?: string
  /** Disables the trigger. */
  disabled?: boolean
  /** Extra classes for the trigger button. */
  className?: string
}) {
  const { t, locale } = useUITranslation()
  const [open, setOpen] = useState(false)

  const selected = parseDay(value)
  const minimum = parseDay(min)
  const maximum = parseDay(max)
  const display = formatDayDisplay(value, locale)
  const calendarLocale = locale === 'zh-CN' ? zhCN : enUS

  const disabledDays: Matcher[] = []
  if (minimum) disabledDays.push({ before: minimum })
  if (maximum) disabledDays.push({ after: maximum })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label={`${ariaLabel}: ${display ?? placeholder}`}
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
          // eslint-disable-next-line jsx-a11y/no-autofocus -- focus should enter the calendar when the popover opens
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
