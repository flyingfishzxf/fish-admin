'use client'

import * as React from 'react'
import { Minus, Plus } from 'lucide-react'
import { useUITranslation } from '../../i18n'

import { cn } from '../../lib/utils'

type InputNumberSize = 'sm' | 'default'

type InputNumberProps = {
  /** Current value; `null` renders an empty field. */
  value?: number | null
  /** Called with the committed value, or `null` when the field is cleared. */
  onValueChange?: (value: number | null) => void
  /** Lower bound; the decrement button disables at this value. */
  min?: number
  /** Upper bound; the increment button disables at this value. */
  max?: number
  /** Amount added or subtracted per step. @default 1 */
  step?: number
  /** Decimal places used for display, rounding and blur normalisation. */
  precision?: number
  /** Disables the input and both stepper buttons. */
  disabled?: boolean
  /** Placeholder shown while the draft is empty. */
  placeholder?: string
  /** Id forwarded to the inner input for pairing with a `Label`. */
  id?: string
  /** Name forwarded to the inner input for form submission. */
  name?: string
  /** Classes applied to the outer wrapper. */
  className?: string
  /** Classes applied to the inner input. */
  inputClassName?: string
  /** Accessible name for the spinbutton. */
  'aria-label'?: string
  /** Control height, 36 px by default or 32 px for `sm`. @default 'default' */
  size?: InputNumberSize
}

function clampValue(value: number, min?: number, max?: number) {
  let next = value
  if (min !== undefined) next = Math.max(min, next)
  if (max !== undefined) next = Math.min(max, next)
  return next
}

function roundValue(value: number, precision?: number) {
  if (precision !== undefined) {
    const factor = 10 ** precision
    return Math.round(value * factor) / factor
  }
  return Number.parseFloat(value.toPrecision(12))
}

function formatValue(value: number | null | undefined, precision?: number) {
  if (value === null || value === undefined || !Number.isFinite(value)) return ''
  if (precision !== undefined) return value.toFixed(precision)
  return String(roundValue(value))
}

/** `null` means empty, `undefined` means not parseable yet (e.g. "-" or "1."). */
function parseDraft(raw: string) {
  const trimmed = raw.trim()
  if (trimmed === '') return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : undefined
}

function InputNumber({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  precision,
  disabled,
  placeholder,
  id,
  name,
  className,
  inputClassName,
  'aria-label': ariaLabel,
  size = 'default',
}: InputNumberProps) {
  const { t } = useUITranslation()
  const [draft, setDraft] = React.useState(() => formatValue(value, precision))
  const [focused, setFocused] = React.useState(false)
  const previousValue = React.useRef(value)
  const previousPrecision = React.useRef(precision)

  React.useEffect(() => {
    const valueChanged = previousValue.current !== value
    const precisionChanged = previousPrecision.current !== precision
    previousValue.current = value
    previousPrecision.current = precision

    if (!focused && (valueChanged || precisionChanged)) {
      setDraft(formatValue(value, precision))
    }
  }, [value, precision, focused])

  const atMin = value !== null && value !== undefined && min !== undefined && value <= min
  const atMax = value !== null && value !== undefined && max !== undefined && value >= max

  const stepBy = (direction: 1 | -1) => {
    const parsed = parseDraft(draft)
    const current = parsed !== null && parsed !== undefined ? parsed : value
    const base =
      current !== null && current !== undefined
        ? current + direction * step
        : direction > 0
          ? (min ?? step)
          : (max ?? -step)
    const next = roundValue(clampValue(base, min, max), precision)

    setDraft(formatValue(next, precision))
    onValueChange?.(next)
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value
    setDraft(raw)

    const parsed = parseDraft(raw)
    if (parsed === null) {
      onValueChange?.(null)
    } else if (parsed !== undefined) {
      onValueChange?.(parsed)
    }
  }

  const handleFocus = () => {
    setFocused(true)
  }

  const handleBlur = () => {
    setFocused(false)

    const parsed = parseDraft(draft)
    if (parsed === null) {
      setDraft('')
      if (value !== null && value !== undefined) onValueChange?.(null)
      return
    }

    if (parsed === undefined) {
      setDraft(formatValue(value, precision))
      return
    }

    const next = roundValue(clampValue(parsed, min, max), precision)
    setDraft(formatValue(next, precision))
    if (value === null || value === undefined || next !== value) {
      onValueChange?.(next)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      stepBy(1)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      stepBy(-1)
    }
  }

  const buttonSize = size === 'sm' ? 'w-8' : 'w-9'

  return (
    <div
      data-slot="input-number"
      data-size={size}
      data-disabled={disabled ? '' : undefined}
      className={cn(
        'group/input-number flex h-9 w-full min-w-0 items-center overflow-hidden rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow] outline-none focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 data-[size=sm]:h-8 dark:bg-input/30',
        className,
      )}
    >
      <button
        type="button"
        data-slot="input-number-decrement"
        aria-label={t('numberInput.decrease')}
        disabled={disabled || atMin}
        onClick={() => stepBy(-1)}
        className={cn(
          'inline-flex h-full shrink-0 items-center justify-center border-r border-input text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground disabled:pointer-events-none disabled:opacity-40',
          buttonSize,
        )}
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <input
        type="text"
        inputMode="decimal"
        role="spinbutton"
        data-slot="input-number-input"
        id={id}
        name={name}
        value={draft}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value ?? undefined}
        aria-valuetext={
          value !== null && value !== undefined ? formatValue(value, precision) : undefined
        }
        autoComplete="off"
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          'h-full w-0 min-w-0 flex-1 appearance-none border-0 bg-transparent px-2 text-center text-sm tabular-nums outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed',
          inputClassName,
        )}
      />
      <button
        type="button"
        data-slot="input-number-increment"
        aria-label={t('numberInput.increase')}
        disabled={disabled || atMax}
        onClick={() => stepBy(1)}
        className={cn(
          'inline-flex h-full shrink-0 items-center justify-center border-l border-input text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground disabled:pointer-events-none disabled:opacity-40',
          buttonSize,
        )}
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}

export { InputNumber }
