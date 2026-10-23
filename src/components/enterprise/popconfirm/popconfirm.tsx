import { useId, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

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
  children: ReactNode
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  pending?: boolean
  destructive?: boolean
  disabled?: boolean
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  className?: string
}) {
  const { t } = useTranslation('common')
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
