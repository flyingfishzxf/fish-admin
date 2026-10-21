import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { AppHeader } from '@/components/layout/app-header'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { CommandMenu } from '@/components/layout/command-menu'
import { OfflineBanner } from '@/components/layout/offline-banner'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { APP_VERSION } from '@/config/app'

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation('common')

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <AppHeader />
        <OfflineBanner />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
        <footer className="mt-auto flex flex-col gap-1 border-t px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>{t('footer.builtWith')}</span>
          <span>
            {APP_VERSION} · {t('footer.license')}
          </span>
        </footer>
      </SidebarInset>
      <CommandMenu />
    </SidebarProvider>
  )
}
