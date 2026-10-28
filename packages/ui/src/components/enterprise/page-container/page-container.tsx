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
  /** Page title, rendered as the page's h1. */
  title: string
  /** One or two sentences under the title. */
  description?: string
  /** Small uppercase label above the title, such as "Workspace". */
  eyebrow?: string
  /** Buttons shown opposite the title from the lg breakpoint. */
  actions?: ReactNode
  /** Filter bar or tabs rendered below the header in a bordered row. */
  tabs?: ReactNode
  /** Page-level footer, separated by a top border. */
  footer?: ReactNode
  /** Makes the tabs row sticky instead of the whole header. @default false */
  stickyHeader?: boolean
  /** Page body; children are spaced with space-y-6. */
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
