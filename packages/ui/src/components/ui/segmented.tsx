'use client'

import * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui'

import { cn } from '../../lib/utils'

type SegmentedOption = {
  value: string
  label: React.ReactNode
  icon?: LucideIcon
  disabled?: boolean
}

type SegmentedProps = {
  options: SegmentedOption[]
  value: string
  onValueChange: (value: string) => void
  'aria-label': string
  size?: 'sm' | 'default'
  className?: string
  disabled?: boolean
}

function Segmented({
  options,
  value,
  onValueChange,
  'aria-label': ariaLabel,
  size = 'default',
  className,
  disabled,
}: SegmentedProps) {
  const isSmall = size === 'sm'

  return (
    <ToggleGroupPrimitive.Root
      data-slot="segmented"
      data-size={size}
      type="single"
      value={value}
      onValueChange={(next) => {
        if (next) onValueChange(next)
      }}
      aria-label={ariaLabel}
      disabled={disabled}
      className={cn('inline-flex w-fit items-center gap-1 rounded-lg bg-muted p-1', className)}
    >
      {options.map((option) => {
        const Icon = option.icon

        return (
          <ToggleGroupPrimitive.Item
            key={option.value}
            data-slot="segmented-item"
            value={option.value}
            disabled={disabled || option.disabled}
            className={cn(
              'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
              isSmall ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-sm',
              'text-muted-foreground hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm',
              isSmall
                ? "[&_svg:not([class*='size-'])]:size-3.5"
                : "[&_svg:not([class*='size-'])]:size-4",
            )}
          >
            {Icon ? <Icon aria-hidden="true" /> : null}
            {option.label}
          </ToggleGroupPrimitive.Item>
        )
      })}
    </ToggleGroupPrimitive.Root>
  )
}

export { Segmented }
export type { SegmentedOption }
