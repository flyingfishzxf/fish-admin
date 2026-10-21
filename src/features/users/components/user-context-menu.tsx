import { BadgeCheck, Copy, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu'
import type { User, UserStatus } from '@/types'

import { USER_STATUSES } from '../schemas'

export function UserContextMenu({
  user,
  currentUserId,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  user: User
  currentUserId?: string
  canEdit: boolean
  canDelete: boolean
  onEdit: (user: User) => void
  onDelete: (user: User) => void
  onStatusChange: (user: User, status: UserStatus) => void
}) {
  const { t } = useTranslation()

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(user.email)
      toast.success(t('users:context.emailCopied'))
    } catch {
      toast.error(t('users:context.copyFailed'))
    }
  }

  return (
    <ContextMenuContent className="w-56">
      <ContextMenuLabel className="font-normal">
        <span className="block truncate text-sm font-medium">{user.name}</span>
        <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
      </ContextMenuLabel>
      <ContextMenuSeparator />
      <ContextMenuItem onSelect={() => void copyEmail()}>
        <Copy />
        {t('users:context.copyEmail')}
      </ContextMenuItem>
      {canEdit ? (
        <ContextMenuItem onSelect={() => onEdit(user)}>
          <Pencil />
          {t('users:actions.edit')}
        </ContextMenuItem>
      ) : null}
      {canEdit ? (
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <BadgeCheck />
            {t('users:context.setStatus')}
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {USER_STATUSES.map((status) => (
              <ContextMenuItem
                key={status}
                disabled={status === user.status}
                onSelect={() => onStatusChange(user, status)}
              >
                {t(`common:status.${status}`)}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
      ) : null}
      {canDelete ? (
        <>
          <ContextMenuSeparator />
          <ContextMenuItem
            variant="destructive"
            disabled={user.id === currentUserId}
            onSelect={() => onDelete(user)}
          >
            <Trash2 />
            {t('users:actions.delete')}
          </ContextMenuItem>
        </>
      ) : null}
    </ContextMenuContent>
  )
}
