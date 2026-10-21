import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ALL_PERMISSION_CODES, PERMISSION_GROUPS, PERMISSIONS } from '@/config/permissions'
import { ApiError } from '@/lib/api-error'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import type { Role } from '@/types'

import { updateRolePermissions } from '../api'

export function RolePermissionDialog({
  role,
  onOpenChange,
  canEdit,
}: {
  role: Role | null
  onOpenChange: (open: boolean) => void
  canEdit: boolean
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const refreshUser = useAuthStore((state) => state.refreshUser)
  const [selected, setSelected] = useState<string[]>([])

  const isProtected = role?.id === 'admin' && role.isSystem
  const readOnly = !canEdit || isProtected

  useEffect(() => {
    if (!role) return
    setSelected(role.permissions.includes('*') ? [...ALL_PERMISSION_CODES] : role.permissions)
  }, [role])

  const mutation = useMutation({
    mutationFn: async () => {
      if (!role) return
      await updateRolePermissions(role.id, selected)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['roles'] })
      void refreshUser()
      toast.success(t('roles:saveSuccess'))
      onOpenChange(false)
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 403) {
        toast.error(t('errors:api.forbidden'))
      } else if (error instanceof ApiError && error.code === 'PROTECTED_ROLE') {
        toast.error(t('roles:wildcard'))
      } else {
        toast.error(t('errors:api.unknown'))
      }
    },
  })

  function togglePermission(code: string, checked: boolean) {
    setSelected((current) =>
      checked ? [...new Set([...current, code])] : current.filter((item) => item !== code),
    )
  }

  function toggleGroup(codes: string[], checked: boolean) {
    setSelected((current) =>
      checked
        ? [...new Set([...current, ...codes])]
        : current.filter((code) => !codes.includes(code)),
    )
  }

  return (
    <Dialog open={Boolean(role)} onOpenChange={(open) => !open && onOpenChange(false)}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('roles:dialog.title', { role: role?.name ?? '' })}</DialogTitle>
          <DialogDescription>{t('roles:dialog.description')}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
          {!readOnly ? (
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setSelected([...ALL_PERMISSION_CODES])}
              >
                {t('roles:selectAll')}
              </Button>
              <Button variant="ghost" size="xs" onClick={() => setSelected([])}>
                {t('roles:clearAll')}
              </Button>
            </div>
          ) : null}

          {PERMISSION_GROUPS.map((group) => {
            const items = PERMISSIONS.filter((permission) => permission.group === group)
            const codes = items.map((item) => item.code)
            const selectedCount = codes.filter((code) => selected.includes(code)).length
            const groupChecked =
              selectedCount === codes.length
                ? true
                : selectedCount > 0
                  ? ('indeterminate' as const)
                  : false

            return (
              <div key={group} className="rounded-xl border p-4">
                <label className="flex items-center gap-3">
                  <Checkbox
                    checked={groupChecked}
                    disabled={readOnly}
                    onCheckedChange={(value) => toggleGroup(codes, value === true)}
                  />
                  <span className="text-sm font-semibold">{t(`roles:groups.${group}`)}</span>
                </label>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {items.map((item) => {
                    const checked = selected.includes(item.code)
                    return (
                      <label
                        key={item.code}
                        className={cn(
                          'flex items-start gap-3 rounded-lg p-2 transition-colors',
                          !readOnly && 'cursor-pointer hover:bg-muted/60',
                        )}
                      >
                        <Checkbox
                          className="mt-0.5"
                          checked={checked}
                          disabled={readOnly}
                          onCheckedChange={(value) => togglePermission(item.code, value === true)}
                        />
                        <span className="min-w-0 space-y-0.5">
                          <span className="block text-sm font-medium">{t(item.labelKey)}</span>
                          <span className="block text-xs leading-relaxed text-muted-foreground">
                            {t(item.descriptionKey)}
                          </span>
                          <code className="block font-mono text-[10px] text-muted-foreground/70">
                            {item.code}
                          </code>
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <div className="hidden space-y-0.5 text-xs text-muted-foreground sm:block">
            <p>{t('roles:saveNote')}</p>
            {!readOnly ? <p>{t('roles:refreshHint')}</p> : null}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {readOnly ? t('common:actions.close') : t('common:actions.cancel')}
            </Button>
            {!readOnly ? (
              <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>
                {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                {t('roles:dialog.save')}
              </Button>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
