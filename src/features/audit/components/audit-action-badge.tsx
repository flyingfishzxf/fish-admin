import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { AUDIT_ACTION_ICONS, AUDIT_ACTION_TONES, AUDIT_TONE_BADGE_CLASSES } from '@/config/audit'
import { cn } from '@/lib/utils'
import type { AuditEvent } from '@/types'

export function AuditActionBadge({
  event,
  className,
}: {
  event: Pick<AuditEvent, 'action'>
  className?: string
}) {
  const { t } = useTranslation()
  const Icon = AUDIT_ACTION_ICONS[event.action]

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 font-normal',
        AUDIT_TONE_BADGE_CLASSES[AUDIT_ACTION_TONES[event.action]],
        className,
      )}
    >
      <Icon className="size-3 shrink-0" />
      {t(`audit:actions.${event.action}`)}
    </Badge>
  )
}
