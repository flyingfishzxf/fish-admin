import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { AppHeader } from '@/components/layout/app-header'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppSubnav } from '@/components/layout/app-subnav'
import { AppTabs } from '@/components/layout/app-tabs'
import { AppTopNav } from '@/components/layout/app-top-nav'
import { CommandMenu } from '@/components/layout/command-menu'
import { OfflineBanner } from '@/components/layout/offline-banner'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { APP_VERSION } from '@/config/app'
import { contentWidthClass } from '@/config/shell'
import { useUiStore } from '@/stores/ui-store'

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation('common')
  const layout = useUiStore((state) => state.layout)
  const density = useUiStore((state) => state.density)
  const contentWidth = useUiStore((state) => state.contentWidth)

  // Density scales `--spacing`, so it has to sit on the root element: menus and
  // drawers render through portals, outside any wrapper this component owns.
  useEffect(() => {
    document.documentElement.dataset.density = density
  }, [density])

  const body = (
    <div className="flex min-w-0 flex-1 flex-col">
      {layout === 'header' ? <AppTopNav /> : <AppHeader />}
      <OfflineBanner />
      {layout === 'mixed' ? <AppSubnav /> : null}
      <AppTabs />
      <main
        className={`mx-auto w-full flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 ${contentWidthClass(contentWidth)}`}
      >
        {children}
      </main>
      <footer className="mt-auto flex flex-col gap-1 border-t px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <span>{t('footer.builtWith')}</span>
        <span>
          {APP_VERSION} · {t('footer.license')}
        </span>
      </footer>
    </div>
  )

  if (layout === 'header') {
    return (
      <TooltipProvider delayDuration={0}>
        <div className="flex min-h-svh w-full flex-col bg-background">
          {body}
          <CommandMenu />
        </div>
      </TooltipProvider>
    )
  }

  return (
    <SidebarProvider defaultOpen={layout !== 'mixed'}>
      <AppSidebar />
      <SidebarInset className="bg-background">{body}</SidebarInset>
      <CommandMenu />
    </SidebarProvider>
  )
}
