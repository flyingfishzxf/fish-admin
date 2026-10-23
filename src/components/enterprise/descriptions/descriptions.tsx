import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface DescriptionItem {
  term: ReactNode
  description: ReactNode
  span?: 1 | 2
}

const COLUMN_CLASSES = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
} as const

const SPAN_CLASSES = {
  1: 'sm:col-span-1',
  2: 'sm:col-span-2',
} as const

export function Descriptions({
  items,
  columns = 2,
  className,
}: {
  items: DescriptionItem[]
  columns?: 1 | 2 | 3
  className?: string
}) {
  return (
    <dl className={cn('grid grid-cols-1 gap-x-8 gap-y-4', COLUMN_CLASSES[columns], className)}>
      {items.map((item, index) => (
        <div key={index} className={cn('min-w-0 space-y-1', item.span === 2 && SPAN_CLASSES[2])}>
          <dt className="text-xs font-medium text-muted-foreground">{item.term}</dt>
          <dd className="text-sm break-words">{item.description}</dd>
        </div>
      ))}
    </dl>
  )
}
