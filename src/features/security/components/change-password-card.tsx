import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { TFunction } from 'i18next'
import { KeyRound, Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@fish-admin/react'
import { z } from '@/config/validation'

import { changePasswordRequest } from '@/features/auth/api'
import { PasswordInput } from '@/features/auth/components/password-input'
import { PasswordStrength } from '@/features/auth/components/password-strength'
import { createChangePasswordSchema } from '@/features/auth/schemas'
import { ApiError } from '@/lib/api-error'

export function ChangePasswordCard() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [serverError, setServerError] = useState<string | null>(null)

  const schema = useMemo(() => createChangePasswordSchema(t), [t])
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })
  const newPassword = form.watch('newPassword')

  const mutation = useMutation({
    mutationFn: (values: { currentPassword: string; newPassword: string }) =>
      changePasswordRequest(values.currentPassword, values.newPassword),
    onSuccess: () => {
      form.reset()
      toast.success(t('security:password.success'))
      void queryClient.invalidateQueries({ queryKey: ['auth', 'sessions'] })
    },
    onError: (error) => setServerError(resolvePasswordError(error, t)),
  })

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="size-4" />
          {t('security:password.title')}
        </CardTitle>
        <CardDescription>{t('security:password.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => {
              setServerError(null)
              mutation.mutate(values)
            })}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('security:password.current')}</FormLabel>
                  <FormControl>
                    <PasswordInput autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('security:password.new')}</FormLabel>
                    <FormControl>
                      <PasswordInput autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('security:password.confirm')}</FormLabel>
                    <FormControl>
                      <PasswordInput autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <PasswordStrength password={newPassword} />

            {serverError ? (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">{t('security:password.hint')}</p>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                {t('security:password.submit')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

function resolvePasswordError(error: unknown, t: TFunction) {
  if (error instanceof ApiError) {
    if (error.code === 'INVALID_PASSWORD') return t('security:password.errors.current')
    if (error.code === 'PASSWORD_UNCHANGED') return t('security:password.errors.unchanged')
    if (error.code === 'WEAK_PASSWORD') return t('security:password.errors.weak')
  }
  return t('security:password.error')
}
