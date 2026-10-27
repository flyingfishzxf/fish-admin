import { Clock } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useUITranslation } from '../../../i18n'

import { Button } from '../../ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { cn } from '../../../lib/utils'

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/
const HOURS = Array.from({ length: 24 }, (_, hour) => hour)

function pad(value: number) {
  return `${value}`.padStart(2, '0')
}

function parseTime(value?: string): { hour: number; minute: number } | undefined {
  if (!value) return undefined
  const match = TIME_PATTERN.exec(value)
  if (!match) return undefined

  return { hour: Number(match[1]), minute: Number(match[2]) }
}

function normalizeStep(step: number) {
  if (!Number.isFinite(step)) return 5
  return Math.min(59, Math.max(1, Math.floor(step)))
}

export function TimePicker({
  value,
  onChange,
  placeholder,
  ariaLabel,
  minuteStep = 5,
  disabled = false,
  className,
}: {
  value?: string
  onChange: (value: string | undefined) => void
  placeholder: string
  ariaLabel: string
  minuteStep?: number
  disabled?: boolean
  className?: string
}) {
  const { t } = useUITranslation()
  const [open, setOpen] = useState(false)

  const time = parseTime(value)
  const step = normalizeStep(minuteStep)
  const display = time ? `${pad(time.hour)}:${pad(time.minute)}` : undefined
  const currentMinute = time?.minute

  const minuteOptions = useMemo(() => {
    const options: number[] = []
    for (let minute = 0; minute < 60; minute += step) options.push(minute)
    if (currentMinute !== undefined && !options.includes(currentMinute)) {
      options.push(currentMinute)
      options.sort((a, b) => a - b)
    }
    return options
  }, [step, currentMinute])

  const update = (hour: number, minute: number) => {
    onChange(`${pad(hour)}:${pad(minute)}`)
  }

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
          <Clock className="size-4 shrink-0" />
          <span className="truncate">{display ?? placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto min-w-64 p-3">
        <div className="flex items-end gap-2">
          <div className="flex flex-col gap-1">
            <span
              aria-hidden
              className="text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase"
            >
              HH
            </span>
            <Select
              value={time ? pad(time.hour) : ''}
              onValueChange={(next) => update(Number(next), time?.minute ?? 0)}
            >
              <SelectTrigger aria-label={`${ariaLabel} hours`} className="w-20">
                <SelectValue placeholder="HH" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-60">
                {HOURS.map((hour) => (
                  <SelectItem key={hour} value={pad(hour)}>
                    {pad(hour)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span aria-hidden className="pb-2 text-muted-foreground">
            :
          </span>
          <div className="flex flex-col gap-1">
            <span
              aria-hidden
              className="text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase"
            >
              MM
            </span>
            <Select
              value={time ? pad(time.minute) : ''}
              onValueChange={(next) => update(time?.hour ?? 0, Number(next))}
            >
              <SelectTrigger aria-label={`${ariaLabel} minutes`} className="w-20">
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-60">
                {minuteOptions.map((minute) => (
                  <SelectItem key={minute} value={pad(minute)}>
                    {pad(minute)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2 border-t pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!time}
            onClick={() => {
              onChange(undefined)
              setOpen(false)
            }}
          >
            {t('enterprise.clear')}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
            {t('actions.close')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
