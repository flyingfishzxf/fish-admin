import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import type { TFunction } from 'i18next'
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { z } from '@/config/validation'
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
import { ApiError } from '@/lib/api-error'

import { resetPasswordRequest } from '../api'
import { createResetPasswordSchema } from '../schemas'
import { AuthShell } from './auth-shell'
import { PasswordInput } from './password-input'
import { PasswordStrength } from './password-strength'

export function ResetPasswordPage({ token, email }: { token?: string; email?: string }) {
  const { t } = useTranslation()
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const schema = useMemo(() => createResetPasswordSchema(t), [t])
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  })
  const password = form.watch('password')

  async function onSubmit(values: z.infer<typeof schema>) {
    if (!token) return
    setServerError(null)
    try {
      await resetPasswordRequest({ token, password: values.password })
      setSuccess(true)
    } catch (error) {
      setServerError(resolveResetError(error, t))
    }
  }

  if (!token) {
    return (
      <AuthShell
        title={t('auth:reset.missingTitle')}
        subtitle={t('auth:reset.missingSubtitle')}
        footer={
          <Link to="/login" className="font-medium text-primary hover:underline">
            {t('auth:backToSignIn')}
          </Link>
        }
      >
        <div className="space-y-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" />
          </div>
          <p className="text-sm text-muted-foreground">{t('auth:reset.missingDescription')}</p>
          <Button asChild variant="outline" className="w-full">
            <Link to="/forgot-password">{t('auth:forgot.submit')}</Link>
          </Button>
        </div>
      </AuthShell>
    )
  }

  if (success) {
    return (
      <AuthShell
        title={t('auth:reset.successTitle')}
        subtitle={t('auth:reset.successSubtitle')}
        footer={
          <Link to="/login" className="font-medium text-primary hover:underline">
            {t('auth:backToSignIn')}
          </Link>
        }
      >
        <div className="space-y-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-600">
            <CheckCircle2 className="size-6" />
          </div>
          <p className="text-sm text-muted-foreground">{t('auth:reset.successDescription')}</p>
          <Button asChild className="w-full" size="lg">
            <Link to="/login" search={{ email }}>
              {t('auth:signIn')}
            </Link>
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={t('auth:reset.title')}
      subtitle={email ? t('auth:reset.subtitleFor', { email }) : t('auth:reset.subtitle')}
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          {t('auth:backToSignIn')}
        </Link>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth:newPassword')}</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="new-password" {...field} />
                </FormControl>
                <PasswordStrength password={password} />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth:confirmPassword')}</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {serverError ? (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {t('auth:reset.submit')}
          </Button>
        </form>
      </Form>
    </AuthShell>
  )
}

function resolveResetError(error: unknown, t: TFunction) {
  if (error instanceof ApiError) {
    if (error.code === 'INVALID_TOKEN') return t('auth:reset.invalidToken')
    if (error.code === 'WEAK_PASSWORD') return t('auth:errors.weakPassword')
  }
  return t('auth:errors.generic')
}
