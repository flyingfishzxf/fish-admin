import { Link, useRouterState } from '@tanstack/react-router'
import { House } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { findNavGroup, findNavItem } from '@/config/nav'

export function AppBreadcrumbs() {
  const { t } = useTranslation()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const group = findNavGroup(pathname)
  const item = findNavItem(pathname)

  return (
    <Breadcrumb className="hidden sm:block">
      <BreadcrumbList>
        <BreadcrumbItem>
          {item?.to === '/' ? (
            <BreadcrumbPage className="flex items-center gap-1.5">
              <House className="size-3.5" />
              {t('nav:breadcrumbs.home')}
            </BreadcrumbPage>
          ) : (
            <BreadcrumbLink asChild>
              <Link to="/" className="flex items-center gap-1.5">
                <House className="size-3.5" />
                <span className="sr-only">{t('nav:breadcrumbs.home')}</span>
              </Link>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>

        {group && item ? (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="hidden lg:block">
              <span className="text-muted-foreground">{t(group.titleKey)}</span>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden lg:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{t(item.titleKey)}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
