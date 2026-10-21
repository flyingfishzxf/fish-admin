import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
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
import type { User } from '@/types'

import { deleteUser } from '../api'

export function DeleteUserDialog({
  user,
  onOpenChange,
}: {
  user: User | null
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) return
      await deleteUser(user.id)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      void queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success(t('users:delete.success', { name: user?.name }))
      onOpenChange(false)
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'CANNOT_DELETE_SELF') {
        toast.error(t('users:deleteSelf'))
      } else if (error instanceof ApiError && error.status === 403) {
        toast.error(t('users:noPermission'))
      } else {
        toast.error(t('users:deleteError'))
      }
    },
  })

  if (!user) return null

  return (
    <AlertDialog open onOpenChange={(open) => !open && onOpenChange(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('users:delete.title', { name: user.name })}</AlertDialogTitle>
          <AlertDialogDescription>{t('users:delete.description')}</AlertDialogDescription>
        </AlertDialogHeader>
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
            {t('users:delete.confirm')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
