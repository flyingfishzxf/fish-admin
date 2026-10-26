import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import type { TFunction } from 'i18next'
import { KeyRound, Loader2, MailCheck } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { ApiError } from '@/lib/api-error'

import { registerRequest } from '../api'
import { createRegisterSchema } from '../schemas'
import { AuthShell } from './auth-shell'
import { PasswordInput } from './password-input'
import { PasswordStrength } from './password-strength'

export function RegisterPage() {
  const { t } = useTranslation()
  const [serverError, setServerError] = useState<string | null>(null)
  const [created, setCreated] = useState<{ email: string; verificationToken: string } | null>(null)

  const schema = useMemo(() => createRegisterSchema(t), [t])
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })
  const password = form.watch('password')

  async function onSubmit(values: z.infer<typeof schema>) {
    setServerError(null)
    try {
      const result = await registerRequest(values)
      setCreated(result)
    } catch (error) {
      setServerError(resolveRegisterError(error, t))
    }
  }

  if (created) {
    return (
      <AuthShell
        title={t('auth:register.successTitle')}
        subtitle={t('auth:register.successSubtitle')}
        footer={
          <Link to="/login" className="font-medium text-primary hover:underline">
            {t('auth:backToSignIn')}
          </Link>
        }
      >
        <div className="space-y-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MailCheck className="size-6" />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t('auth:register.sentTo', { email: created.email })}
          </p>
          <Alert>
            <KeyRound />
            <AlertDescription>{t('auth:register.demoToken')}</AlertDescription>
          </Alert>
          <Button asChild className="w-full" size="lg">
            <Link
              to="/verify-email"
              search={{ token: created.verificationToken, email: created.email }}
            >
              {t('auth:register.verifyNow')}
            </Link>
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={t('auth:register.title')}
      subtitle={t('auth:register.subtitle')}
      footer={
        <span>
          {t('auth:register.haveAccount')}{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            {t('auth:signIn')}
          </Link>
        </span>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth:name')}</FormLabel>
                <FormControl>
                  <Input autoComplete="name" placeholder={t('auth:namePlaceholder')} {...field} />
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
                <FormLabel>{t('auth:email')}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder={t('auth:emailPlaceholder')}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth:password')}</FormLabel>
                <FormControl>
                  <PasswordInput
                    autoComplete="new-password"
                    placeholder={t('auth:passwordPlaceholder')}
                    {...field}
                  />
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
            {t('auth:register.submit')}
          </Button>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t('auth:register.demoNote')}
          </p>
        </form>
      </Form>
    </AuthShell>
  )
}

function resolveRegisterError(error: unknown, t: TFunction) {
  if (error instanceof ApiError) {
    if (error.code === 'EMAIL_TAKEN') return t('auth:errors.emailTaken')
    if (error.code === 'WEAK_PASSWORD') return t('auth:errors.weakPassword')
  }
  return t('auth:errors.generic')
}
