import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { BrandMark } from '@/components/common/brand'
import { ThemeSync } from '@/components/common/theme-sync'
import { Button } from '@fish-admin/react'
import { useDocumentTitle } from '@/lib/document-title'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: RootNotFound,
})

function RootLayout() {
  return (
    <>
      <ThemeSync />
      <Outlet />
    </>
  )
}

function RootNotFound() {
  const { t } = useTranslation('errors')
  useDocumentTitle(t('notFound.title'))

  return (
    <div className="bg-brand-soft relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-20" />
      <div className="relative flex flex-col items-center">
        <BrandMark className="size-12" />
        <p className="mt-6 text-xs font-semibold tracking-[0.28em] text-primary">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t('notFound.title')}</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{t('notFound.description')}</p>
        <Button asChild className="mt-6">
          <Link to="/">{t('notFound.action')}</Link>
        </Button>
      </div>
    </div>
  )
}
