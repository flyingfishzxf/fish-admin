import { useTranslation } from 'react-i18next'

import { AppBreadcrumbs } from '@/components/layout/app-breadcrumbs'
import { HeaderActions } from '@/components/layout/header-actions'
import { Separator, SidebarTrigger } from '@fish-admin/react'

export function AppHeader() {
  const { t } = useTranslation('common')

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-xl sm:px-6">
      <SidebarTrigger className="-ml-1.5" aria-label={t('header.toggleSidebar')} />
      <Separator orientation="vertical" className="mx-1 hidden h-4 sm:block" />
      <AppBreadcrumbs />
      <HeaderActions />
    </header>
  )
}
