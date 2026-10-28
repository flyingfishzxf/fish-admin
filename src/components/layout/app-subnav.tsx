import { useRouterState } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { NavItemLink } from '@/components/layout/nav-item-link'
import { findNavItem, flattenInternalNavItems, isExternalNavItem, isPathActive } from '@/config/nav'
import { useMenuNavGroups } from '@/features/navigation/queries'
import { cn } from '@fish-admin/react'

/** The second row of the `mixed` shell: the active group, spread out as chips. */
export function AppSubnav() {
  const { t } = useTranslation()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const groups = useMenuNavGroups()
  const activeItem = findNavItem(pathname, groups)
  const group = groups.find(
    (candidate) =>
      activeItem !== undefined &&
      flattenInternalNavItems([candidate]).some((entry) => entry.to === activeItem.to),
  )

  if (!group) return null

  return (
    <nav
      aria-label={t(group.titleKey)}
      className="flex shrink-0 items-center gap-1 overflow-x-auto border-b px-4 py-2 sm:px-6"
    >
      {group.items.map((item) => (
        <NavItemLink
          key={isExternalNavItem(item) ? item.href : item.to}
          item={item}
          className={cn(
            'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
            !isExternalNavItem(item) && isPathActive(pathname, item.to)
              ? 'border-primary bg-primary/10 text-foreground'
              : 'text-muted-foreground hover:bg-muted/60',
          )}
        >
          {t(item.titleKey)}
        </NavItemLink>
      ))}
    </nav>
  )
}
