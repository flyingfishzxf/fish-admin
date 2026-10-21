import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { KeyRound, Loader2, MailCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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

import { forgotPasswordRequest } from '../api'
import { createForgotPasswordSchema } from '../schemas'
import { AuthShell } from './auth-shell'

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [result, setResult] = useState<{ email: string; token?: string } | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const schema = useMemo(() => createForgotPasswordSchema(t), [t])
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: z.infer<typeof schema>) {
    setServerError(null)
    try {
      const response = await forgotPasswordRequest(values.email)
      setResult({ email: values.email, token: response.demoResetToken })
    } catch {
      setServerError(t('auth:errors.generic'))
    }
  }

  if (result) {
    return (
      <AuthShell
        title={t('auth:forgot.sentTitle')}
        subtitle={t('auth:forgot.sentSubtitle')}
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
            {t('auth:forgot.sentTo', { email: result.email })}
          </p>
          {result.token ? (
            <>
              <Alert>
                <KeyRound />
                <AlertTitle>{t('auth:forgot.demoTitle')}</AlertTitle>
                <AlertDescription>{t('auth:forgot.demoDescription')}</AlertDescription>
              </Alert>
              <Button asChild className="w-full" size="lg">
                <Link to="/reset-password" search={{ token: result.token, email: result.email }}>
                  {t('auth:forgot.openDemoLink')}
                </Link>
              </Button>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">{t('auth:forgot.noAccountHint')}</p>
          )}
          <Button asChild variant="outline" className="w-full">
            <Link to="/register">{t('auth:register.title')}</Link>
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={t('auth:forgot.title')}
      subtitle={t('auth:forgot.subtitle')}
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
          <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {t('auth:forgot.submit')}
          </Button>
          {serverError ? (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          ) : null}
          <p className="text-xs leading-relaxed text-muted-foreground">{t('auth:forgot.note')}</p>
        </form>
      </Form>
    </AuthShell>
  )
}
