import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { LanguageToggle } from '@/components/common/language-toggle'
import { ThemeToggle } from '@/components/common/theme-toggle'
import { NotificationBell } from '@/components/layout/notification-bell'
import { UserMenu } from '@/components/layout/user-menu'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useUiStore } from '@/stores/ui-store'

export function HeaderActions() {
  const { t } = useTranslation('common')
  const setCommandOpen = useUiStore((state) => state.setCommandOpen)

  return (
    <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
      <Button
        variant="outline"
        size="sm"
        className="hidden h-8 gap-2 font-normal text-muted-foreground lg:flex"
        onClick={() => setCommandOpen(true)}
        data-tour="search"
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
      <NotificationBell />
      <ThemeToggle />
      <LanguageToggle />
      <Separator orientation="vertical" className="mx-1 hidden h-4 sm:block" />
      <UserMenu />
    </div>
  )
}
