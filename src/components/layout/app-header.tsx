import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { LanguageToggle } from '@/components/common/language-toggle'
import { ThemeToggle } from '@/components/common/theme-toggle'
import { AppBreadcrumbs } from '@/components/layout/app-breadcrumbs'
import { UserMenu } from '@/components/layout/user-menu'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useUiStore } from '@/stores/ui-store'

export function AppHeader() {
  const { t } = useTranslation('common')
  const setCommandOpen = useUiStore((state) => state.setCommandOpen)

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-xl sm:px-6">
      <SidebarTrigger className="-ml-1.5" aria-label={t('header.toggleSidebar')} />
      <Separator orientation="vertical" className="mx-1 hidden h-4 sm:block" />
      <AppBreadcrumbs />

      <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
        <Button
          variant="outline"
          size="sm"
          className="hidden h-8 gap-2 font-normal text-muted-foreground lg:flex"
          onClick={() => setCommandOpen(true)}
        >
          <Search className="size-3.5" />
          <span>{t('header.search')}</span>
          <kbd className="pointer-events-none ml-5 rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
            {t('command.shortcut')}
          </kbd>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 lg:hidden"
          aria-label={t('header.openCommand')}
          onClick={() => setCommandOpen(true)}
        >
          <Search className="size-4" />
        </Button>
        <ThemeToggle />
        <LanguageToggle />
        <Separator orientation="vertical" className="mx-1 hidden h-4 sm:block" />
        <UserMenu />
      </div>
    </header>
  )
}
