import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import type { TFunction } from 'i18next'
import { AlertTriangle, Loader2, MailCheck } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
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
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError } from '@/lib/api-error'
import { formatDate } from '@/lib/format'
import { useAuthStore } from '@/stores/auth-store'
import type { InvitePreview } from '@/types'

import { acceptInviteRequest, getInviteRequest } from '../api'
import { createAcceptInviteSchema } from '../schemas'
import { AuthShell } from './auth-shell'
import { PasswordInput } from './password-input'
import { PasswordStrength } from './password-strength'

export function AcceptInvitePage({ token }: { token?: string }) {
  const { t } = useTranslation()
  const inviteQuery = useQuery({
    queryKey: ['auth', 'invite', token],
    queryFn: ({ signal }) => getInviteRequest(token!, signal),
    enabled: Boolean(token),
    retry: false,
  })

  const footer = (
    <Link to="/login" className="font-medium text-primary hover:underline">
      {t('auth:backToSignIn')}
    </Link>
  )

  if (!token) {
    return (
      <AuthShell
        title={t('auth:invite.missingTitle')}
        subtitle={t('auth:invite.missingSubtitle')}
        footer={footer}
      >
        <InvalidInvite description={t('auth:invite.missingDescription')} />
      </AuthShell>
    )
  }

  if (inviteQuery.isPending) {
    return (
      <AuthShell
        title={t('auth:invite.loadingTitle')}
        subtitle={t('auth:invite.loadingSubtitle')}
        footer={footer}
      >
        <div className="space-y-4">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </AuthShell>
    )
  }

  if (inviteQuery.isError || !inviteQuery.data) {
    return (
      <AuthShell
        title={t('auth:invite.invalidTitle')}
        subtitle={t('auth:invite.invalidSubtitle')}
        footer={footer}
      >
        <InvalidInvite
          description={
            inviteQuery.error instanceof ApiError && inviteQuery.error.code === 'INVITE_EXPIRED'
              ? t('auth:invite.expired')
              : t('auth:invite.invalidDescription')
          }
        />
      </AuthShell>
    )
  }

  return <InviteForm token={token} invite={inviteQuery.data} footer={footer} />
}

function InvalidInvite({ description }: { description: string }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-4">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" />
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      <Button asChild variant="outline" className="w-full">
        <Link to="/login">{t('auth:backToSignIn')}</Link>
      </Button>
    </div>
  )
}

function InviteForm({
  token,
  invite,
  footer,
}: {
  token: string
  invite: InvitePreview
  footer: ReactNode
}) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const completeLogin = useAuthStore((state) => state.completeLogin)
  const [serverError, setServerError] = useState<string | null>(null)

  const schema = useMemo(() => createAcceptInviteSchema(t), [t])
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: invite.name ?? '',
      password: '',
      confirmPassword: '',
    },
  })
  const password = form.watch('password')

  async function onSubmit(values: z.infer<typeof schema>) {
    setServerError(null)
    try {
      const tokens = await acceptInviteRequest({
        token,
        name: values.name,
        email: invite.email,
        password: values.password,
      })
      await completeLogin(tokens)
      toast.success(t('auth:invite.successToast'))
      navigate({ to: '/', replace: true })
    } catch (error) {
      setServerError(resolveInviteError(error, t))
    }
  }

  return (
    <AuthShell title={t('auth:invite.title')} subtitle={t('auth:invite.subtitle')} footer={footer}>
      <div className="space-y-5">
        <div className="rounded-2xl border bg-muted/35 p-4">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MailCheck className="size-5" />
            </span>
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium">{invite.email}</p>
              <p className="text-xs text-muted-foreground">
                {t('auth:invite.invitedBy', { name: invite.invitedByName })}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant="secondary">{invite.roleName}</Badge>
                <span className="text-[11px] text-muted-foreground">
                  {t('auth:invite.expires', {
                    date: formatDate(invite.expiresAt, i18n.language, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    }),
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth:name')}</FormLabel>
                  <FormControl>
                    <Input autoComplete="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <Label htmlFor="invite-email">{t('auth:email')}</Label>
              <Input id="invite-email" value={invite.email} disabled aria-readonly />
            </div>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth:password')}</FormLabel>
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

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              {t('auth:invite.submit')}
            </Button>
          </form>
        </Form>
      </div>
    </AuthShell>
  )
}

function resolveInviteError(error: unknown, t: TFunction) {
  if (error instanceof ApiError) {
    if (error.code === 'INVITE_EXPIRED' || error.code === 'INVITE_USED') {
      return t('auth:invite.invalidDescription')
    }
    if (error.code === 'EMAIL_TAKEN') return t('auth:errors.emailTaken')
    if (error.code === 'WEAK_PASSWORD') return t('auth:errors.weakPassword')
  }
  return t('auth:errors.generic')
}
