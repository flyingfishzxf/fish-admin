import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { ErrorState } from '@/components/common/error-state'
import {
  Transfer,
  type TransferItem,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Skeleton,
} from '@fish-admin/react'

import { ApiError } from '@/lib/api-error'
import { useAuthStore } from '@/stores/auth-store'
import type { Role } from '@/types'

import { updateRolePermissions } from '../api'
import { expandWildcard, isImmutableRole } from '../permissions'
import { usePermissionsQuery } from '@/features/permissions/queries'

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
  const permissionsQuery = usePermissionsQuery(Boolean(role))
  const refreshUser = useAuthStore((state) => state.refreshUser)
  const [selected, setSelected] = useState<string[]>([])

  const readOnly = !canEdit || (role ? isImmutableRole(role) : false)

  useEffect(() => {
    if (!role) return
    setSelected(expandWildcard(role.permissions))
  }, [role])

  const items = useMemo<TransferItem[]>(
    () =>
      (permissionsQuery.data ?? []).map((permission) => ({
        key: permission.code,
        label: t(permission.labelKey),
        description: t(permission.descriptionKey),
        group: t(`roles:groups.${permission.group}`),
        searchText: permission.code,
      })),
    [permissionsQuery.data, t],
  )

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

  return (
    <Dialog open={Boolean(role)} onOpenChange={(open) => !open && onOpenChange(false)}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('roles:dialog.title', { role: role?.name ?? '' })}</DialogTitle>
          <DialogDescription>{t('roles:dialog.description')}</DialogDescription>
        </DialogHeader>

        {permissionsQuery.isPending ? (
          <div className="grid gap-3 md:grid-cols-2">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        ) : permissionsQuery.isError ? (
          <ErrorState
            title={t('roles:transfer.loadError')}
            onRetry={() => void permissionsQuery.refetch()}
            className="border-0 py-8"
          />
        ) : (
          <Transfer
            items={items}
            value={selected}
            onChange={setSelected}
            sourceTitle={t('roles:transfer.available')}
            targetTitle={t('roles:transfer.granted')}
            searchPlaceholder={t('roles:transfer.search')}
            emptySourceLabel={t('roles:transfer.allGranted')}
            emptyTargetLabel={t('roles:transfer.noneGranted')}
            disabled={readOnly || mutation.isPending}
          />
        )}

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
              <Button
                disabled={
                  mutation.isPending || permissionsQuery.isPending || permissionsQuery.isError
                }
                onClick={() => mutation.mutate()}
              >
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
