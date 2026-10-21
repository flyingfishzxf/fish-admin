import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import type { TFunction } from 'i18next'
import { ArrowUpRight, Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'

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
import { DEMO_ACCOUNTS, DEMO_INVITE } from '@/config/demo'
import { ApiError } from '@/lib/api-error'
import { sanitizeRedirect } from '@/lib/auth'
import { useAuthStore } from '@/stores/auth-store'

import { isMfaRequired } from '../api'
import { createLoginSchema } from '../schemas'
import { AuthShell } from './auth-shell'
import { PasswordInput } from './password-input'

export function LoginPage({ redirect, email }: { redirect?: string; email?: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [serverError, setServerError] = useState<string | null>(null)

  const schema = useMemo(() => createLoginSchema(t), [t])
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: email ?? '', password: '' },
  })

  async function onSubmit(values: z.infer<typeof schema>) {
    setServerError(null)
    try {
      const result = await login(values.email, values.password)
      if (isMfaRequired(result)) {
        await navigate({
          to: '/otp',
          search: { challenge: result.challengeId, email: values.email, redirect },
          replace: true,
        })
        return
      }
      toast.success(t('auth:loginSuccess'))
      navigate({ href: sanitizeRedirect(redirect) ?? '/', replace: true })
    } catch (error) {
      setServerError(resolveLoginError(error, t))
    }
  }

  function fillDemoAccount(emailValue: string, password: string) {
    setServerError(null)
    form.setValue('email', emailValue, { shouldValidate: true })
    form.setValue('password', password, { shouldValidate: true })
  }

  return (
    <AuthShell
      title={t('auth:title')}
      subtitle={t('auth:subtitle')}
      footer={
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span>
            {t('auth:noAccount')}{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">
              {t('auth:createAccount')}
            </Link>
          </span>
          <span aria-hidden className="text-border">
            ·
          </span>
          <Link
            to="/accept-invite"
            search={{ token: DEMO_INVITE.token }}
            className="font-medium text-primary hover:underline"
          >
            {t('auth:haveInvite')}
          </Link>
        </div>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                <div className="flex items-center justify-between gap-3">
                  <FormLabel>{t('auth:password')}</FormLabel>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    {t('auth:forgotPassword')}
                  </Link>
                </div>
                <FormControl>
                  <PasswordInput
                    autoComplete="current-password"
                    placeholder={t('auth:passwordPlaceholder')}
                    {...field}
                  />
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
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t('auth:signingIn')}
              </>
            ) : (
              t('auth:signIn')
            )}
          </Button>
        </form>
      </Form>

      <div className="mt-7 space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-medium">{t('auth:demo.title')}</p>
          <p className="text-[11px] text-muted-foreground">{t('auth:demo.description')}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.role}
              type="button"
              onClick={() => fillDemoAccount(account.email, account.password)}
              title={t(`auth:demo.${account.role}Hint`)}
              className="group rounded-xl border bg-background/60 p-3 text-left transition hover:border-primary/40 hover:bg-primary/5"
            >
              <span className="flex items-center justify-between gap-1">
                <span className="text-xs font-semibold">{t(`auth:demo.${account.role}`)}</span>
                <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
              </span>
              <span className="mt-1 block truncate text-[11px] text-muted-foreground">
                {account.email}
              </span>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          {t('auth:footer.demoNote')}
          <span className="lg:hidden"> {t('auth:demo.disclaimer')}</span>
        </p>
      </div>
    </AuthShell>
  )
}

function resolveLoginError(error: unknown, t: TFunction) {
  if (!(error instanceof ApiError)) return t('auth:loginError')

  switch (error.code) {
    case 'INVALID_CREDENTIALS':
      return t('auth:invalidCredentials')
    case 'ACCOUNT_LOCKED':
      return t('auth:errors.locked')
    case 'EMAIL_NOT_VERIFIED':
      return t('auth:errors.emailNotVerified')
    case 'ACCOUNT_INACTIVE':
      return t('auth:errors.inactive')
    default:
      return t('auth:loginError')
  }
}
