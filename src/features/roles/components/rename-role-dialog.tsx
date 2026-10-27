import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@fish-admin/react'

import { ApiError } from '@/lib/api-error'
import type { Role } from '@/types'

import { updateRole } from '../api'

export function RenameRoleDialog({
  role,
  onOpenChange,
}: {
  role: Role | null
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!role) return
    setName(role.name)
    setError(null)
  }, [role])

  const mutation = useMutation({
    mutationFn: () => {
      if (!role) throw new Error('Missing role')
      return updateRole(role.id, { name: name.trim() })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success(t('roles:rename.success'))
      onOpenChange(false)
    },
    onError: (mutationError) => {
      if (mutationError instanceof ApiError && mutationError.code === 'ROLE_NAME_TAKEN') {
        setError(t('roles:wizard.nameTaken'))
      } else if (mutationError instanceof ApiError && mutationError.code === 'PROTECTED_ROLE') {
        setError(t('roles:protected'))
      } else {
        setError(t('roles:rename.error'))
      }
    },
  })

  return (
    <Dialog open={Boolean(role)} onOpenChange={(open) => !open && onOpenChange(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('roles:rename.title', { role: role?.name ?? '' })}</DialogTitle>
          <DialogDescription>{t('roles:rename.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="rename-role">{t('roles:rename.field')}</Label>
          <Input
            id="rename-role"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={40}
            aria-invalid={Boolean(error) || undefined}
          />
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            {t('common:actions.cancel')}
          </Button>
          <Button
            disabled={mutation.isPending || name.trim().length < 2}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {t('roles:rename.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
