import { Star } from 'lucide-react'
import { useRef, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

export function Rate({
  value = 0,
  onChange,
  max = 5,
  readOnly = false,
  allowClear = true,
  ariaLabel,
  className,
}: {
  value?: number
  onChange?: (value: number) => void
  max?: number
  readOnly?: boolean
  allowClear?: boolean
  ariaLabel?: string
  className?: string
}) {
  const { t } = useTranslation('common')
  const [hovered, setHovered] = useState<number | null>(null)
  const buttonsRef = useRef(new Array<HTMLButtonElement | null>(max))
  const interactive = !readOnly && Boolean(onChange)
  const active = hovered ?? value

  const select = (next: number) => {
    if (!interactive) return
    onChange?.(next === value && allowClear ? 0 : next)
  }

  const focusStar = (index: number) => {
    buttonsRef.current[index]?.focus()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!interactive) return
    const lastIndex = max - 1

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        event.preventDefault()
        focusStar(Math.min(index + 1, lastIndex))
        break
      case 'ArrowLeft':
      case 'ArrowDown':
        event.preventDefault()
        focusStar(Math.max(index - 1, 0))
        break
      case 'Home':
        event.preventDefault()
        focusStar(0)
        break
      case 'End':
        event.preventDefault()
        focusStar(lastIndex)
        break
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel ?? t('enterprise.rating')}
      data-slot="rate"
      className={cn('inline-flex items-center gap-0.5', className)}
      onMouseLeave={() => setHovered(null)}
    >
      {Array.from({ length: max }, (_, index) => {
        const star = index + 1
        const filled = star <= active

        return (
          <button
            key={star}
            ref={(node) => {
              buttonsRef.current[index] = node
            }}
            type="button"
            role="radio"
            aria-checked={star === value}
            aria-label={t('enterprise.rateValue', { count: star, max })}
            tabIndex={interactive && star === (value || 1) ? 0 : -1}
            disabled={!interactive}
            onMouseEnter={() => interactive && setHovered(star)}
            onFocus={() => interactive && setHovered(star)}
            onBlur={() => setHovered(null)}
            onClick={() => select(star)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              'rounded-sm p-0.5 text-muted-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-default',
              filled && 'text-warning',
            )}
          >
            <Star aria-hidden className={cn('size-5', filled && 'fill-current')} />
          </button>
        )
      })}
    </div>
  )
}
