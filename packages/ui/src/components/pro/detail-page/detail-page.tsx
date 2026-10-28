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
  /** Node rendered above the header, typically a back link or breadcrumb. */
  back?: ReactNode
  /** Leading media such as an Avatar, pinned to the left of the header. */
  avatar?: ReactNode
  /** The record name, shown as the page `h1` and truncated when long. */
  title: string
  /** Short secondary line under the title, such as an email or handle. */
  subtitle?: string
  /** Status chips rendered inline right after the title. */
  badges?: ReactNode
  /** Muted supporting facts, laid out in a wrapping row under the subtitle. */
  meta?: ReactNode
  /** Buttons aligned to the right of the header. */
  actions?: ReactNode
  /** Sections shown as a tab list; when empty or absent, `children` renders instead. */
  tabs?: DetailPageTab[]
  /** The tab value opened first; falls back to the first tab. */
  defaultTab?: string
  /** Accessible name of the tab list. */
  tabsLabel?: string
  /** Content rendered after the body, often a secondary action row. */
  footer?: ReactNode
  /** Body content shown when no tabs are supplied. */
  children?: ReactNode
  /** Extra classes for the outer stack. */
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
