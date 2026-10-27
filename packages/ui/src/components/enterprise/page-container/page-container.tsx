import type { ReactNode } from 'react'

import { PageHeader } from '../../common/page-header'
import { cn } from '../../../lib/utils'

export function PageContainer({
  title,
  description,
  eyebrow,
  actions,
  tabs,
  footer,
  stickyHeader = false,
  children,
  className,
}: {
  title: string
  description?: string
  eyebrow?: string
  actions?: ReactNode
  tabs?: ReactNode
  footer?: ReactNode
  stickyHeader?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <div data-slot="page-container" className={cn('flex flex-col gap-6', className)}>
      <PageHeader title={title} description={description} eyebrow={eyebrow} actions={actions} />
      {tabs ? (
        <div
          data-slot="page-container-tabs"
          className={cn(
            'border-b',
            stickyHeader && 'sticky top-0 z-10 bg-background/95 backdrop-blur',
          )}
        >
          {tabs}
        </div>
      ) : null}
      <div className="space-y-6">{children}</div>
      {footer ? (
        <footer data-slot="page-container-footer" className="border-t pt-6">
          {footer}
        </footer>
      ) : null}
    </div>
  )
}
