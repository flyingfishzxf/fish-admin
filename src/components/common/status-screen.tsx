import { Link } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { BrandMark } from '@/components/common/brand'
import { LanguageToggle } from '@/components/common/language-toggle'
import { ThemeToggle } from '@/components/common/theme-toggle'
import { cn } from '@/lib/utils'

const TONES = {
  primary: 'bg-primary/10 text-primary',
  destructive: 'bg-destructive/10 text-destructive',
  warning: 'bg-amber-500/12 text-amber-600 dark:text-amber-400',
  muted: 'bg-muted text-muted-foreground',
} as const

export function StatusScreen({
  code,
  title,
  description,
  hint,
  icon: Icon,
  tone = 'primary',
  actions,
}: {
  code: string
  title: string
  description: string
  hint?: string
  icon: LucideIcon
  tone?: keyof typeof TONES
  actions?: ReactNode
}) {
  return (
    <div className="bg-brand-soft relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 py-16 text-center">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-20" />
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <ThemeToggle />
        <LanguageToggle />
      </div>
      <div className="relative flex w-full max-w-lg flex-col items-center">
        <Link
          to="/"
          aria-label="FishAdmin"
          className="rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <BrandMark className="size-12" />
        </Link>
        <div
          className={cn('mt-8 flex size-16 items-center justify-center rounded-3xl', TONES[tone])}
        >
          <Icon className="size-7" />
        </div>
        <p className="mt-6 text-xs font-semibold tracking-[0.28em] text-primary">{code}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance">{title}</h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
        {hint ? <p className="mt-2 max-w-md text-xs text-muted-foreground/80">{hint}</p> : null}
        {actions ? (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">{actions}</div>
        ) : null}
      </div>
    </div>
  )
}
