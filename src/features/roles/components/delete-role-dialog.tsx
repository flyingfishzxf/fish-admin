import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api-error'
import type { Role } from '@/types'

import { deleteRole } from '../api'

export function DeleteRoleDialog({
  role,
  onOpenChange,
  onDeleted,
}: {
  role: Role | null
  onOpenChange: (open: boolean) => void
  onDeleted?: (role: Role) => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => {
      if (!role) throw new Error('Missing role')
      return deleteRole(role.id)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success(t('roles:deleteRole.success'))
      onOpenChange(false)
      if (role) onDeleted?.(role)
    },
    onError: (mutationError) => {
      if (mutationError instanceof ApiError && mutationError.code === 'ROLE_IN_USE') {
        setError(t('roles:deleteRole.inUse'))
      } else if (mutationError instanceof ApiError && mutationError.code === 'PROTECTED_ROLE') {
        setError(t('roles:protected'))
      } else {
        setError(t('roles:deleteRole.error'))
      }
    },
  })

  return (
    <AlertDialog
      open={Boolean(role)}
      onOpenChange={(open) => {
        if (!open) {
          setError(null)
          onOpenChange(false)
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('roles:deleteRole.title', { role: role?.name ?? '' })}
          </AlertDialogTitle>
          <AlertDialogDescription>{t('roles:deleteRole.description')}</AlertDialogDescription>
        </AlertDialogHeader>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>
            {t('common:actions.cancel')}
          </AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {t('roles:deleteRole.confirm')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
