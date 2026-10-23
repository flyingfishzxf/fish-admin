'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

type SpinnerSize = 'sm' | 'default' | 'lg'

type SpinnerProps = {
  size?: SpinnerSize
  label?: string
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
  loading: boolean
  label?: string
  children?: React.ReactNode
  className?: string
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
