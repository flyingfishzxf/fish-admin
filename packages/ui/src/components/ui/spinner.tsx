'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'

import { cn } from '../../lib/utils'

type SpinnerSize = 'sm' | 'default' | 'lg'

type SpinnerProps = {
  /** Icon size: `sm` is 14 px, `default` 16 px, `lg` 24 px. @default 'default' */
  size?: SpinnerSize
  /** Accessible name for the `status` region; without it the spinner is `aria-hidden`. */
  label?: string
  /** Extra classes merged onto the wrapping `<span>`. */
  className?: string
}

const spinnerSizeClasses: Record<SpinnerSize, string> = {
  sm: 'size-3.5',
  default: 'size-4',
  lg: 'size-6',
}

function Spinner({ size = 'default', label, className }: SpinnerProps) {
  return (
    <span
      data-slot="spinner"
      data-size={size}
      role={label ? 'status' : undefined}
      aria-hidden={label ? undefined : true}
      className={cn('inline-flex shrink-0 items-center justify-center', className)}
    >
      <Loader2 aria-hidden="true" className={cn('animate-spin', spinnerSizeClasses[size])} />
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  )
}

type LoadingOverlayProps = {
  /** Whether the overlay is shown; mirrored as `aria-busy` on the wrapper. */
  loading: boolean
  /** Accessible name announced by the spinner inside the overlay. */
  label?: string
  /** Content rendered under the overlay. */
  children?: React.ReactNode
  /** Extra classes merged onto the wrapping `<div>`. */
  className?: string
  /** Milliseconds to wait before showing the overlay, so fast loads do not flash. @default 150 */
  delay?: number
}

function LoadingOverlay({ loading, label, children, className, delay = 150 }: LoadingOverlayProps) {
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    if (!loading) {
      setVisible(false)
      return
    }

    if (delay <= 0) {
      setVisible(true)
      return
    }

    const timer = window.setTimeout(() => setVisible(true), delay)
    return () => window.clearTimeout(timer)
  }, [loading, delay])

  return (
    <div data-slot="loading-overlay" aria-busy={loading} className={cn('relative', className)}>
      {children}
      {loading && visible ? (
        <div
          data-slot="loading-overlay-content"
          className="absolute inset-0 z-10 grid place-items-center rounded-[inherit] bg-background/70 backdrop-blur-sm"
        >
          <Spinner label={label} />
        </div>
      ) : null}
    </div>
  )
}

export { LoadingOverlay, Spinner }
