import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { TFunction } from 'i18next'
import { Loader2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/lib/api-error'
import type { Department } from '@/types'

import { createDepartment, updateDepartment } from '../api'

type DepartmentFormValues = { name: string }

function createDepartmentSchema(t: TFunction) {
  const field = t('departments:form.name')
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, t('validation:required', { field }))
      .min(2, t('validation:minLength', { field, min: 2 }))
      .max(40, t('validation:maxLength', { field, max: 40 })),
  })
}

export function DepartmentFormDialog({
  open,
  onOpenChange,
  mode,
  parent,
  department,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'rename'
  parent?: Department | null
  department?: Department | null
  onCreated?: (department: Department) => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const schema = useMemo(() => createDepartmentSchema(t), [t])
  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  })

  useEffect(() => {
    if (!open) return
    form.reset({ name: mode === 'rename' ? (department?.name ?? '') : '' })
  }, [open, mode, department, form])

  const mutation = useMutation({
    mutationFn: (values: DepartmentFormValues) =>
      mode === 'create'
        ? createDepartment({ name: values.name, parentId: parent?.id ?? null })
        : updateDepartment(department!.id, { name: values.name }),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ['departments'] })
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(
        t(mode === 'create' ? 'departments:createSuccess' : 'departments:updateSuccess'),
      )
      if (mode === 'create') onCreated?.(created)
      onOpenChange(false)
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'DEPARTMENT_NAME_TAKEN') {
        form.setError('name', { message: t('departments:nameTaken') })
      } else if (error instanceof ApiError && error.code === 'INVALID_PARENT') {
        form.setError('name', { message: t('departments:invalidParent') })
      } else {
        form.setError('name', { message: t('errors:api.unknown') })
      }
    },
  })

  const title =
    mode === 'rename'
      ? t('departments:form.renameTitle')
      : parent
        ? t('departments:form.createChildTitle')
        : t('departments:form.createTitle')
  const description =
    mode === 'rename'
      ? t('departments:form.renameDescription')
      : parent
        ? t('departments:form.createChildDescription', { parent: parent.name })
        : t('departments:form.createRootDescription')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('departments:form.name')}</FormLabel>
                  <FormControl>
                    <Input
                      autoFocus
                      placeholder={t('departments:form.namePlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={mutation.isPending}
                onClick={() => onOpenChange(false)}
              >
                {t('common:actions.cancel')}
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                {t(mode === 'create' ? 'departments:form.create' : 'departments:form.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
