import { Lock, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Role } from '@/types'

export function RoleColumnMenu({
  role,
  canRename,
  canDelete,
  onRename,
  onDelete,
}: {
  role: Role
  canRename: boolean
  canDelete: boolean
  onRename: (role: Role) => void
  onDelete: (role: Role) => void
}) {
  const { t } = useTranslation()

  if (!canRename && !canDelete) {
    if (!role.isSystem) return null
    return (
      <span title={t('roles:protected')} className="text-muted-foreground">
        <Lock className="size-3.5" aria-label={t('roles:protected')} />
      </span>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={t('roles:matrix.roleActions', { role: role.name })}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {canRename ? (
          <DropdownMenuItem onSelect={() => onRename(role)}>
            <Pencil />
            {t('roles:matrix.rename')}
          </DropdownMenuItem>
        ) : null}
        {canRename && canDelete ? <DropdownMenuSeparator /> : null}
        {canDelete ? (
          <DropdownMenuItem variant="destructive" onSelect={() => onDelete(role)}>
            <Trash2 />
            {t('roles:matrix.delete')}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
