import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { DEMO_DEPARTMENTS } from '@/config/demo'
import { ApiError } from '@/lib/api-error'
import type { RoleOption, User } from '@/types'
import { zodResolver } from '@hookform/resolvers/zod'

import { createUser, updateUser } from '../api'
import { createUserSchema, USER_STATUSES, type UserFormValues } from '../schemas'

const EMPTY_VALUES: UserFormValues = {
  name: '',
  email: '',
  roleId: '',
  status: 'active',
  department: '',
}

export function UserFormDrawer({
  open,
  onOpenChange,
  user,
  roles,
  rolesLoading = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  roles: RoleOption[]
  rolesLoading?: boolean
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [serverError, setServerError] = useState<string | null>(null)
  const isEditing = Boolean(user)

  const schema = useMemo(() => createUserSchema(t), [t])
  const form = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_VALUES,
  })

  useEffect(() => {
    if (!open) return
    setServerError(null)
    form.reset(
      user
        ? {
            name: user.name,
            email: user.email,
            roleId: user.roleId,
            status: user.status,
            department: user.department,
          }
        : EMPTY_VALUES,
    )
  }, [open, user, form])

  const mutation = useMutation({
    mutationFn: (values: UserFormValues) =>
      user ? updateUser(user.id, values) : createUser(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      void queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success(t(isEditing ? 'users:updateSuccess' : 'users:createSuccess'))
      onOpenChange(false)
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'EMAIL_TAKEN') {
        setServerError(t('users:emailTaken'))
      } else if (error instanceof ApiError && error.code === 'CANNOT_DEACTIVATE_SELF') {
        setServerError(t('users:deactivateSelf'))
      } else if (error instanceof ApiError && error.code === 'CANNOT_CHANGE_OWN_ROLE') {
        setServerError(t('users:changeRoleSelf'))
      } else {
        setServerError(t('errors:api.unknown'))
      }
    },
  })

  function onSubmit(values: UserFormValues) {
    setServerError(null)
    mutation.mutate(values)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b p-5 sm:p-6">
          <SheetTitle>
            {t(isEditing ? 'users:form.editTitle' : 'users:form.createTitle')}
          </SheetTitle>
          <SheetDescription>
            {t(isEditing ? 'users:form.editDescription' : 'users:form.createDescription')}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
              {serverError ? (
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertDescription>{serverError}</AlertDescription>
                </Alert>
              ) : null}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('users:form.name')}</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="name"
                        placeholder={t('users:form.namePlaceholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('users:form.email')}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="email"
                        placeholder={t('users:form.emailPlaceholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="roleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('users:form.role')}</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={rolesLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('users:form.rolePlaceholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('users:form.status')}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {USER_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {t(`common:status.${status}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('users:form.department')}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('users:form.departmentPlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEMO_DEPARTMENTS.map((department) => (
                          <SelectItem key={department} value={department}>
                            {t(`common:departments.${department}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <SheetFooter className="flex-row justify-end border-t p-4 sm:p-5">
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
                {t(isEditing ? 'common:actions.saveChanges' : 'common:actions.create')}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
