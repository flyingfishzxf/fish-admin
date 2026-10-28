import { Link, useRouterState } from '@tanstack/react-router'
import { FlaskConical } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { BrandMark } from '@/components/common/brand'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from '@fish-admin/react'
import { APP_VERSION } from '@/config/app'
import { findNavItem, isExternalNavItem, isPathActive } from '@/config/nav'
import { NavItemLink } from '@/components/layout/nav-item-link'
import { useMenuNavGroups } from '@/features/navigation/queries'

export function AppSidebar() {
  const { t } = useTranslation()
  const { isMobile, setOpenMobile } = useSidebar()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const groups = useMenuNavGroups()
  const activeItem = findNavItem(pathname, groups)
  const closeMobileSidebar = () => {
    if (isMobile) setOpenMobile(false)
  }

  return (
    <Sidebar collapsible="icon" variant="inset" data-tour="sidebar">
      <SidebarHeader>
        <Link to="/" onClick={closeMobileSidebar} className="flex items-center gap-2.5 px-1.5 py-1">
          <BrandMark />
          <div className="grid min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-semibold tracking-tight">
              {t('common:app.name')}
            </span>
            <span className="truncate text-[11px] text-muted-foreground">
              {t('common:app.tagline')}
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-1">
        {groups.map((group) => (
          <SidebarGroup key={group.titleKey} className="px-2 py-1">
            <SidebarGroupLabel className="h-7 group-data-[collapsible=icon]:-mt-7">
              {t(group.titleKey)}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const children = isExternalNavItem(item) ? [] : (item.children ?? [])
                  const href = isExternalNavItem(item) ? item.href : item.to
                  return (
                    <SidebarMenuItem key={href}>
                      <SidebarMenuButton
                        asChild
                        isActive={!isExternalNavItem(item) && isPathActive(pathname, item.to)}
                        tooltip={t(item.titleKey)}
                      >
                        <NavItemLink item={item} onNavigate={closeMobileSidebar}>
                          <Icon />
                          <span>{t(item.titleKey)}</span>
                        </NavItemLink>
                      </SidebarMenuButton>
                      {children.length > 0 ? (
                        <SidebarMenuSub>
                          {children.map((child) => (
                            <SidebarMenuSubItem key={child.to}>
                              <SidebarMenuSubButton asChild isActive={activeItem?.to === child.to}>
                                <Link to={child.to} onClick={closeMobileSidebar}>
                                  <span>{t(child.titleKey)}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      ) : null}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="gap-1.5">
        <div className="rounded-xl border border-sidebar-border/60 bg-sidebar-accent/60 p-2.5 group-data-[collapsible=icon]:hidden">
          <p className="flex items-center gap-2 text-xs font-semibold">
            <FlaskConical className="size-3.5 text-primary" />
            {t('common:sidebar.demoTitle')}
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
            {t('common:sidebar.demoDescription')}
          </p>
        </div>
        <p className="px-2 pb-0.5 text-[11px] text-muted-foreground group-data-[collapsible=icon]:hidden">
          {t('common:sidebar.version', { version: APP_VERSION })}
        </p>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
