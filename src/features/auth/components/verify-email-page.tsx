import { Link } from '@tanstack/react-router'
import { AlertTriangle, CheckCircle2, Loader2, MailCheck } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription, Button } from '@fish-admin/react'

import { ApiError } from '@/lib/api-error'

import { verifyEmailRequest } from '../api'
import { AuthShell } from './auth-shell'

export function VerifyEmailPage({ token, email }: { token?: string; email?: string }) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [verifiedEmail, setVerifiedEmail] = useState(email)
  const [error, setError] = useState<string | null>(null)

  if (!token) {
    return (
      <AuthShell
        title={t('auth:verify.missingTitle')}
        subtitle={t('auth:verify.missingSubtitle')}
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
          <p className="text-sm text-muted-foreground">{t('auth:verify.missingDescription')}</p>
          <Button asChild variant="outline" className="w-full">
            <Link to="/register">{t('auth:register.title')}</Link>
          </Button>
        </div>
      </AuthShell>
    )
  }

  async function verify() {
    setStatus('loading')
    setError(null)
    try {
      const result = await verifyEmailRequest(token!)
      setVerifiedEmail(result.email)
      setStatus('success')
    } catch (requestError) {
      setStatus('error')
      setError(
        requestError instanceof ApiError && requestError.code === 'INVALID_TOKEN'
          ? t('auth:verify.invalid')
          : t('auth:errors.generic'),
      )
    }
  }

  if (status === 'success') {
    return (
      <AuthShell
        title={t('auth:verify.successTitle')}
        subtitle={t('auth:verify.successSubtitle')}
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
          <p className="text-sm text-muted-foreground">
            {t('auth:verify.verifiedFor', { email: verifiedEmail })}
          </p>
          <Button asChild className="w-full" size="lg">
            <Link to="/login" search={{ email: verifiedEmail }}>
              {t('auth:signIn')}
            </Link>
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={t('auth:verify.title')}
      subtitle={t('auth:verify.subtitle')}
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
          {email ? t('auth:verify.sentTo', { email }) : t('auth:verify.sentGeneric')}
        </p>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <Button
          className="w-full"
          size="lg"
          disabled={status === 'loading'}
          onClick={() => void verify()}
        >
          {status === 'loading' ? <Loader2 className="size-4 animate-spin" /> : null}
          {t('auth:verify.confirm')}
        </Button>
      </div>
    </AuthShell>
  )
}
