import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { ErrorState } from '@/components/common/error-state'
import { Stepper } from '@/components/enterprise/stepper/stepper'
import { Transfer, type TransferItem } from '@/components/enterprise/transfer/transfer'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { usePermissionsQuery } from '@/features/permissions/queries'
import { ApiError } from '@/lib/api-error'
import type { Role } from '@/types'

import { createRole } from '../api'

export function CreateRoleWizard({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (role: Role) => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const permissionsQuery = usePermissionsQuery(open)
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [permissions, setPermissions] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setStep(0)
    setName('')
    setDescription('')
    setPermissions([])
    setError(null)
  }, [open])

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
    mutationFn: () =>
      createRole({
        name: name.trim(),
        description: description.trim(),
        permissions,
      }),
    onSuccess: (role) => {
      void queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success(t('roles:wizard.created'))
      onOpenChange(false)
      onCreated?.(role)
    },
    onError: (mutationError) => {
      if (mutationError instanceof ApiError && mutationError.code === 'ROLE_NAME_TAKEN') {
        setStep(0)
        setError(t('roles:wizard.nameTaken'))
        return
      }
      setError(t('roles:wizard.createError'))
    },
  })

  function nextStep() {
    const trimmed = name.trim()
    if (trimmed.length < 2 || trimmed.length > 40) {
      setError(t('roles:wizard.nameInvalid'))
      return
    }
    setError(null)
    setStep(1)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onOpenChange(false)}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('roles:wizard.title')}</DialogTitle>
          <DialogDescription>{t('roles:wizard.description')}</DialogDescription>
        </DialogHeader>

        <Stepper
          steps={[
            {
              id: 'basic',
              title: t('roles:wizard.basic'),
              description: t('roles:wizard.basicDescription'),
            },
            {
              id: 'permissions',
              title: t('roles:wizard.permissions'),
              description: t('roles:wizard.permissionsDescription'),
            },
          ]}
          current={step}
          onStepClick={(index) => {
            if (index < step) {
              setError(null)
              setStep(index)
            }
          }}
          ariaLabel={t('roles:wizard.stepsLabel')}
        />

        {step === 0 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">{t('roles:wizard.name')}</Label>
              <Input
                id="role-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t('roles:wizard.namePlaceholder')}
                maxLength={40}
                aria-invalid={Boolean(error) || undefined}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-description">{t('roles:wizard.descriptionField')}</Label>
              <Textarea
                id="role-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={t('roles:wizard.descriptionPlaceholder')}
                maxLength={200}
                rows={3}
              />
            </div>
          </div>
        ) : permissionsQuery.isPending ? (
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
            value={permissions}
            onChange={setPermissions}
            sourceTitle={t('roles:transfer.available')}
            targetTitle={t('roles:transfer.granted')}
            searchPlaceholder={t('roles:transfer.search')}
            emptySourceLabel={t('roles:transfer.allGranted')}
            emptyTargetLabel={t('roles:transfer.noneGranted')}
            disabled={mutation.isPending}
          />
        )}

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <DialogFooter className="flex-row justify-end">
          <Button
            variant="outline"
            disabled={mutation.isPending}
            onClick={() => onOpenChange(false)}
          >
            {t('common:actions.cancel')}
          </Button>
          {step === 1 ? (
            <Button variant="ghost" disabled={mutation.isPending} onClick={() => setStep(0)}>
              {t('roles:wizard.back')}
            </Button>
          ) : null}
          {step === 0 ? (
            <Button onClick={nextStep}>{t('roles:wizard.next')}</Button>
          ) : (
            <Button
              disabled={
                mutation.isPending || permissionsQuery.isPending || permissionsQuery.isError
              }
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {t('roles:wizard.create')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
