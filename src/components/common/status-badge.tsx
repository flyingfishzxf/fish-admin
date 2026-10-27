import { useTranslation } from 'react-i18next'

import { Badge, cn } from '@fish-admin/react'

import type { UserStatus } from '@/types'

const DOT_STYLES: Record<UserStatus, string> = {
  active: 'bg-success',
  invited: 'bg-warning',
  inactive: 'bg-muted-foreground/60',
}

export function StatusBadge({ status }: { status: UserStatus }) {
  const { t } = useTranslation('common')

  return (
    <Badge variant="outline" className="gap-1.5 font-normal">
      <span className={cn('size-1.5 rounded-full', DOT_STYLES[status])} />
      {t(`status.${status}`)}
    </Badge>
  )
}
