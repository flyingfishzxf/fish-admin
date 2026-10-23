import * as React from 'react'

import { cn } from '@/lib/utils'

type EmptyProps = React.ComponentProps<'div'> & {
  variant?: 'default' | 'outline'
}

function Empty({ className, variant = 'default', ...props }: EmptyProps) {
  return (
    <div
      data-slot="empty"
      data-variant={variant}
      className={cn(
        'flex min-w-0 flex-1 flex-col items-center justify-center gap-6 rounded-lg p-6 text-center text-balance md:p-12',
        variant === 'outline' && 'border border-dashed border-border',
        className,
      )}
      {...props}
    />
  )
}

function EmptyHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-header"
      className={cn('flex max-w-sm flex-col items-center gap-2 text-center', className)}
      {...props}
    />
  )
}

type EmptyMediaProps = React.ComponentProps<'div'> & {
  variant?: 'default' | 'icon'
}

function EmptyMedia({ className, variant = 'default', ...props }: EmptyMediaProps) {
  return (
    <div
      data-slot="empty-media"
      data-variant={variant}
      className={cn(
        'mb-2 flex shrink-0 items-center justify-center',
        variant === 'icon' &&
          "size-10 rounded-lg bg-muted text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
        className,
      )}
      {...props}
    />
  )
}

function EmptyTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-title"
      className={cn('text-lg font-medium tracking-tight', className)}
      {...props}
    />
  )
}

function EmptyDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-description"
      className={cn(
        'text-sm text-muted-foreground [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary',
        className,
      )}
      {...props}
    />
  )
}

function EmptyContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="empty-content"
      className={cn(
        'flex w-full max-w-sm min-w-0 flex-col items-center gap-4 text-sm text-balance',
        className,
      )}
      {...props}
    />
  )
}

export { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle }
