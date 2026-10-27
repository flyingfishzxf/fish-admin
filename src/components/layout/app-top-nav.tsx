import { useNavigate, useRouterState } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { BrandMark } from '@/components/common/brand'
import { HeaderActions } from '@/components/layout/header-actions'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@fish-admin/react'

import { findNavItem, isPathActive } from '@/config/nav'
import { useMenuNavGroups } from '@/features/navigation/queries'

export function AppTopNav() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const groups = useMenuNavGroups()
  const activeItem = findNavItem(pathname, groups)

  return (
    <header
      className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-1 border-b bg-background/80 px-4 backdrop-blur-xl sm:px-6"
      data-tour="topnav"
    >
      <button
        type="button"
        onClick={() => navigate({ to: '/' })}
        className="flex items-center gap-2.5 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-muted/60"
        aria-label={t('app.name')}
      >
        <BrandMark />
        <span className="hidden text-sm font-semibold tracking-tight lg:block">
          {t('app.name')}
        </span>
      </button>

      <nav className="no-scrollbar ml-2 flex min-w-0 items-center gap-0.5 overflow-x-auto">
        {groups.map((group) => {
          const inGroup = group.items.some(
            (item) => activeItem?.to === item.to || item.to === activeItem?.to,
          )
          return (
            <DropdownMenu key={group.titleKey}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={inGroup ? 'bg-muted text-foreground' : 'text-muted-foreground'}
                >
                  {t(group.titleKey)}
                  <ChevronDown className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  {t(group.titleKey)}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {group.items.map((item) => {
                  const Icon = item.icon
                  const entries = item.children?.length ? item.children : [item]
                  return entries.map((entry) => (
                    <DropdownMenuItem
                      key={entry.to}
                      className={isPathActive(pathname, entry.to) ? 'bg-accent' : undefined}
                      onClick={() => navigate({ to: entry.to })}
                    >
                      {entry === item ? <Icon /> : <span className="w-4" aria-hidden />}
                      {t(entry.titleKey)}
                    </DropdownMenuItem>
                  ))
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        })}
      </nav>

      <HeaderActions />
    </header>
  )
}
