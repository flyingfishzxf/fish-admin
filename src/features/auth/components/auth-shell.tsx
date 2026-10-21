import { Database, Palette, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Brand } from '@/components/common/brand'
import { LanguageToggle } from '@/components/common/language-toggle'
import { ThemeToggle } from '@/components/common/theme-toggle'

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}) {
  const { t } = useTranslation('auth')
  const features = [
    { icon: ShieldCheck, label: t('brand.featureRbac') },
    { icon: Database, label: t('brand.featureMock') },
    { icon: Palette, label: t('brand.featureTheme') },
  ]

  return (
    <div className="flex min-h-svh bg-background">
      <aside className="bg-brand relative hidden overflow-hidden p-10 text-white lg:flex lg:w-[46%] lg:flex-col lg:justify-between">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative">
          <Brand className="[&_p]:text-white" />
        </div>

        <div className="relative max-w-md space-y-6">
          <h2 className="text-3xl leading-tight font-semibold tracking-tight text-balance">
            {t('brand.headline')}
          </h2>
          <p className="text-sm leading-relaxed text-white/80">{t('brand.description')}</p>
          <ul className="space-y-3">
            {features.map((feature) => (
              <li key={feature.label} className="flex items-center gap-3 text-sm text-white/90">
                <span className="flex size-8 items-center justify-center rounded-lg bg-white/12 backdrop-blur">
                  <feature.icon className="size-4" />
                </span>
                {feature.label}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative max-w-sm text-xs leading-relaxed text-white/60">
          {t('demo.disclaimer')}
        </p>
      </aside>

      <main className="relative flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <div className="absolute top-4 right-4 flex items-center gap-1">
          <ThemeToggle />
          <LanguageToggle />
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Brand />
          </div>

          <div className="shadow-soft rounded-3xl border bg-card p-6 sm:p-8">
            <div className="space-y-1.5">
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
            <div className="mt-6">{children}</div>
          </div>

          {footer ? (
            <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
          ) : null}
        </div>
      </main>
    </div>
  )
}
