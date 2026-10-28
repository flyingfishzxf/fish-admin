import { useId, useState, type ReactNode } from 'react'
import { useUITranslation } from '../../../i18n'

import { Button } from '../../ui/button'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '../../ui/popover'
import { cn } from '../../../lib/utils'

export function Popconfirm({
  children,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  pending = false,
  destructive = false,
  disabled = false,
  side = 'top',
  align = 'center',
  className,
}: {
  /** Trigger element; pass a single button so focus returns to it on close. */
  children: ReactNode
  /** Question shown in the popover; used as the alertdialog's name. */
  title: string
  /** Consequence of confirming, linked through aria-describedby. */
  description?: string
  /** Confirm button text; defaults to the localized "Confirm". */
  confirmLabel?: string
  /** Footer button text; defaults to the localized "Cancel". */
  cancelLabel?: string
  /** Runs when Confirm is pressed; the popover closes immediately afterwards. */
  onConfirm: () => void
  /** Disables Confirm and sets aria-busy while an operation is in flight. @default false */
  pending?: boolean
  /** Confirm button style: destructive for deletes and revocations. @default false */
  destructive?: boolean
  /** Blocks opening and marks the trigger aria-disabled. @default false */
  disabled?: boolean
  /** Preferred side of the trigger. @default 'top' */
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** Alignment along the chosen side. @default 'center' */
  align?: 'start' | 'center' | 'end'
  className?: string
}) {
  const { t } = useUITranslation()
  const [open, setOpen] = useState(false)
  const id = useId()
  const titleId = `${id}-title`
  const descriptionId = `${id}-description`

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!disabled) setOpen(next)
      }}
    >
      <PopoverTrigger asChild aria-disabled={disabled || undefined}>
        {children}
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        role="alertdialog"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        aria-busy={pending || undefined}
        className={cn('w-72 p-4', className)}
      >
        <PopoverHeader className="gap-1">
          <PopoverTitle id={titleId} className="text-sm font-semibold">
            {title}
          </PopoverTitle>
          {description ? (
            <PopoverDescription id={descriptionId} className="text-sm">
              {description}
            </PopoverDescription>
          ) : null}
        </PopoverHeader>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
            {cancelLabel ?? t('actions.cancel')}
          </Button>
          <Button
            type="button"
            variant={destructive ? 'destructive' : 'default'}
            size="sm"
            disabled={pending}
            onClick={() => {
              onConfirm()
              if (!pending) setOpen(false)
            }}
          >
            {confirmLabel ?? t('actions.confirm')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
