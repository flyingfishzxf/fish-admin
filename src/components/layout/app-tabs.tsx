import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { ChevronDown, Pin, RefreshCw, X } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { findNavItem, flattenNavItems, type AppPath } from '@/config/nav'
import { useMenuNavGroups } from '@/features/navigation/queries'
import { cn } from '@/lib/utils'
import { useUiStore, type ShellTab } from '@/stores/ui-store'

/**
 * The tab workbench. Reachability comes from the server menu, so a path the
 * current role cannot see is never recorded and never survives a role switch.
 */
export function AppTabs() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const search = useRouterState({ select: (state) => state.location.search })
  const groups = useMenuNavGroups()
  const tabs = useUiStore((state) => state.tabs)
  const openTab = useUiStore((state) => state.openTab)
  const closeTab = useUiStore((state) => state.closeTab)
  const closeOtherTabs = useUiStore((state) => state.closeOtherTabs)
  const closeTabsToRight = useUiStore((state) => state.closeTabsToRight)
  const closeAllTabs = useUiStore((state) => state.closeAllTabs)
  const toggleTabPin = useUiStore((state) => state.toggleTabPin)
  const keepOnlyTabs = useUiStore((state) => state.keepOnlyTabs)

  const reachable = useMemo(() => flattenNavItems(groups).map((item) => item.to), [groups])

  useEffect(() => {
    // An empty menu means the request has not resolved yet, not that the role
    // can reach nothing: pruning here would wipe every tab on each cold load.
    if (reachable.length === 0) return
    keepOnlyTabs(reachable)
  }, [keepOnlyTabs, reachable])

  useEffect(() => {
    if (!reachable.includes(pathname as AppPath)) return
    openTab({ to: pathname as AppPath, search, pinned: false })
  }, [openTab, pathname, reachable, search])

  function titleOf(tab: ShellTab) {
    const item = findNavItem(tab.to, groups)
    return item ? t(item.titleKey) : tab.to
  }

  function close(tab: ShellTab) {
    const remaining = tabs.filter((entry) => entry.to !== tab.to)
    closeTab(tab.to)
    if (tab.to !== pathname) return
    const next = remaining[remaining.length - 1]
    if (next) void navigate({ to: next.to, search: next.search as never })
    else void navigate({ to: '/' })
  }

  function closeAll() {
    const remaining = tabs.filter((tab) => tab.pinned)
    closeAllTabs()
    if (remaining.some((tab) => tab.to === pathname)) return
    const next = remaining[0]
    if (next) void navigate({ to: next.to, search: next.search as never })
    else void navigate({ to: '/' })
  }

  if (tabs.length === 0) return null

  return (
    <nav
      aria-label={t('tabs.label')}
      className="no-scrollbar flex shrink-0 items-center gap-1 overflow-x-auto border-b bg-muted/20 px-4 py-1.5 sm:px-6"
    >
      {tabs.map((tab) => {
        const active = tab.to === pathname
        return (
          <div
            key={tab.to}
            className={cn(
              'group/tab flex h-7 shrink-0 items-center rounded-md border text-xs transition-colors',
              active
                ? 'border-border bg-background text-foreground'
                : 'border-transparent text-muted-foreground hover:bg-muted/60',
            )}
          >
            <Link
              to={tab.to}
              search={tab.search as never}
              aria-current={active ? 'page' : undefined}
              className="flex max-w-45 items-center gap-1 truncate px-2"
            >
              {tab.pinned ? <Pin className="size-3 shrink-0" /> : null}
              <span className="truncate">{titleOf(tab)}</span>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 opacity-0 group-hover/tab:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
                  aria-label={t('tabs.menu', { title: titleOf(tab) })}
                >
                  <ChevronDown className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuItem onClick={() => toggleTabPin(tab.to)}>
                  <Pin className="size-3.5" />
                  {t(tab.pinned ? 'tabs.unpin' : 'tabs.pin')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (active) void queryClient.invalidateQueries()
                    else void navigate({ to: tab.to, search: tab.search as never })
                  }}
                >
                  <RefreshCw className="size-3.5" />
                  {t('tabs.reload')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => close(tab)}>{t('tabs.close')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => closeOtherTabs(tab.to)}>
                  {t('tabs.closeOthers')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => closeTabsToRight(tab.to)}>
                  {t('tabs.closeRight')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 opacity-0 group-hover/tab:opacity-100 focus-visible:opacity-100"
                  aria-label={t('tabs.closeTitle', { title: titleOf(tab) })}
                  onClick={() => close(tab)}
                >
                  <X className="size-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{t('tabs.close')}</TooltipContent>
            </Tooltip>
          </div>
        )
      })}
      <Button
        variant="ghost"
        size="sm"
        className="ml-auto h-6 shrink-0 px-2 text-xs text-muted-foreground"
        onClick={closeAll}
      >
        {t('tabs.closeAll')}
      </Button>
    </nav>
  )
}
