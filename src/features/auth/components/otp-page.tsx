import { Link, useNavigate } from '@tanstack/react-router'
import type { TFunction } from 'i18next'
import { AlertTriangle, Loader2, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { DEMO_MFA_CODE } from '@/config/demo'
import { ApiError } from '@/lib/api-error'
import { sanitizeRedirect } from '@/lib/auth'
import { useAuthStore } from '@/stores/auth-store'

import { AuthShell } from './auth-shell'

export function OtpPage({
  challenge,
  email,
  redirect,
}: {
  challenge?: string
  email?: string
  redirect?: string
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const completeMfa = useAuthStore((state) => state.completeMfa)
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const footer = (
    <Link to="/login" className="font-medium text-primary hover:underline">
      {t('auth:otp.useAnotherAccount')}
    </Link>
  )

  if (!challenge) {
    return (
      <AuthShell
        title={t('auth:otp.missingTitle')}
        subtitle={t('auth:otp.missingSubtitle')}
        footer={footer}
      >
        <div className="space-y-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" />
          </div>
          <p className="text-sm text-muted-foreground">{t('auth:otp.missingDescription')}</p>
          <Button asChild variant="outline" className="w-full">
            <Link to="/login">{t('auth:backToSignIn')}</Link>
          </Button>
        </div>
      </AuthShell>
    )
  }

  async function submit(value: string) {
    if (submitting || value.length !== 6) return
    setSubmitting(true)
    setError(null)
    try {
      await completeMfa(challenge!, value)
      toast.success(t('auth:loginSuccess'))
      navigate({ href: sanitizeRedirect(redirect) ?? '/', replace: true })
    } catch (requestError) {
      setError(resolveOtpError(requestError, t))
      setSubmitting(false)
      setCode('')
    }
  }

  return (
    <AuthShell
      title={t('auth:otp.title')}
      subtitle={email ? t('auth:otp.subtitleFor', { email }) : t('auth:otp.subtitle')}
      footer={footer}
    >
      <div className="space-y-5">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck className="size-6" />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{t('auth:otp.description')}</p>

        <div className="space-y-2">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={setCode}
            onComplete={(value) => void submit(value)}
            autoFocus
            aria-invalid={Boolean(error)}
            containerClassName="justify-center"
          >
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <InputOTPSlot key={index} index={index} className="size-11 text-base" />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Alert>
          <ShieldCheck />
          <AlertDescription>{t('auth:otp.demoHint', { code: DEMO_MFA_CODE })}</AlertDescription>
        </Alert>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Button
          className="w-full"
          size="lg"
          disabled={submitting || code.length !== 6}
          onClick={() => void submit(code)}
        >
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          {t('auth:otp.verify')}
        </Button>
      </div>
    </AuthShell>
  )
}

function resolveOtpError(error: unknown, t: TFunction) {
  if (error instanceof ApiError) {
    if (error.code === 'INVALID_CODE') return t('auth:otp.invalidCode')
    if (error.code === 'MFA_EXPIRED') return t('auth:otp.expired')
  }
  return t('auth:errors.generic')
}
