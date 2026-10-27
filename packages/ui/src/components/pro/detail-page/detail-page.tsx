import type { ReactNode } from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs'
import { cn } from '../../../lib/utils'

export type DetailPageTab = {
  value: string
  label: string
  content: ReactNode
}

export function DetailPage({
  back,
  avatar,
  title,
  subtitle,
  badges,
  meta,
  actions,
  tabs,
  defaultTab,
  tabsLabel,
  footer,
  children,
  className,
}: {
  back?: ReactNode
  avatar?: ReactNode
  title: string
  subtitle?: string
  badges?: ReactNode
  meta?: ReactNode
  actions?: ReactNode
  tabs?: DetailPageTab[]
  defaultTab?: string
  tabsLabel?: string
  footer?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <div data-slot="detail-page" className={cn('space-y-6', className)}>
      {back}

      <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          {avatar ? <div className="shrink-0">{avatar}</div> : null}
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-semibold tracking-tight">{title}</h1>
              {badges}
            </div>
            {subtitle ? <p className="truncate text-sm text-muted-foreground">{subtitle}</p> : null}
            {meta ? (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {meta}
              </div>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </header>

      {tabs && tabs.length > 0 ? (
        <Tabs defaultValue={defaultTab ?? tabs[0]?.value} className="gap-4">
          <TabsList aria-label={tabsLabel}>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              {tab.content}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        children
      )}

      {footer}
    </div>
  )
}
