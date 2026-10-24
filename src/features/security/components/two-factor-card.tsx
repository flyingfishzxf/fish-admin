import { useMutation } from '@tanstack/react-query'
import type { TFunction } from 'i18next'
import { Check, Copy, Loader2, ShieldCheck, ShieldOff } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'
import {
  disableTwoFactorRequest,
  enableTwoFactorRequest,
  setupTwoFactorRequest,
} from '@/features/auth/api'
import { PasswordInput } from '@/features/auth/components/password-input'
import { ApiError } from '@/lib/api-error'
import { useAuthStore } from '@/stores/auth-store'

export function TwoFactorCard() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const refreshUser = useAuthStore((state) => state.refreshUser)
  const enabled = Boolean(user?.twoFactorEnabled)

  const [setupOpen, setSetupOpen] = useState(false)
  const [setupData, setSetupData] = useState<{ secret: string; demoCode: string } | null>(null)
  const [code, setCode] = useState('')
  const [setupError, setSetupError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [disableOpen, setDisableOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [disableError, setDisableError] = useState<string | null>(null)

  const setupMutation = useMutation({
    mutationFn: setupTwoFactorRequest,
    onSuccess: (data) => {
      setSetupData(data)
      setCode('')
      setSetupError(null)
      setCopied(false)
      setSetupOpen(true)
    },
    onError: () => toast.error(t('security:twoFactor.setup.error')),
  })

  const enableMutation = useMutation({
    mutationFn: enableTwoFactorRequest,
    onSuccess: async () => {
      await refreshUser()
      setSetupOpen(false)
      toast.success(t('security:twoFactor.setup.success'))
    },
    onError: (error) => setSetupError(resolveSetupError(error, t)),
  })

  const disableMutation = useMutation({
    mutationFn: disableTwoFactorRequest,
    onSuccess: async () => {
      await refreshUser()
      setDisableOpen(false)
      setPassword('')
      toast.success(t('security:twoFactor.disableDialog.success'))
    },
    onError: (error) => setDisableError(resolveDisableError(error, t)),
  })

  async function copySecret() {
    if (!setupData) return
    try {
      await navigator.clipboard.writeText(setupData.secret)
      setCopied(true)
      toast.success(t('security:twoFactor.setup.copied'))
    } catch {
      // Clipboard access can be blocked; the secret is still visible for manual copying.
    }
  }

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4" />
              {t('security:twoFactor.title')}
            </CardTitle>
            <CardDescription>{t('security:twoFactor.description')}</CardDescription>
          </div>
          <Badge variant={enabled ? 'default' : 'secondary'}>
            {enabled ? t('security:twoFactor.enabled') : t('security:twoFactor.disabled')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <span
              className={
                enabled
                  ? 'flex size-10 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-600'
                  : 'flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground'
              }
            >
              {enabled ? <ShieldCheck className="size-5" /> : <ShieldOff className="size-5" />}
            </span>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {enabled ? t('security:twoFactor.enabled') : t('security:twoFactor.disabled')}
              </p>
              <p className="text-xs text-muted-foreground">
                {enabled
                  ? t('security:twoFactor.enabledDescription')
                  : t('security:twoFactor.disabledDescription')}
              </p>
            </div>
          </div>
          <Button
            variant={enabled ? 'outline' : 'default'}
            disabled={setupMutation.isPending}
            onClick={() => {
              if (enabled) {
                setDisableError(null)
                setPassword('')
                setDisableOpen(true)
              } else {
                setupMutation.mutate()
              }
            }}
          >
            {setupMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {enabled ? t('security:twoFactor.disable') : t('security:twoFactor.enable')}
          </Button>
        </div>
      </CardContent>

      <Dialog
        open={setupOpen}
        onOpenChange={(open) => {
          setSetupOpen(open)
          if (!open) {
            setSetupError(null)
            setCode('')
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('security:twoFactor.setup.title')}</DialogTitle>
            <DialogDescription>{t('security:twoFactor.setup.description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('security:twoFactor.setup.secret')}</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-lg border bg-muted/40 px-3 py-2 font-mono text-sm">
                  {setupData?.secret}
                </code>
                <Button variant="outline" size="icon" onClick={() => void copySecret()}>
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  <span className="sr-only">{t('security:twoFactor.setup.copy')}</span>
                </Button>
              </div>
            </div>
            <Alert>
              <ShieldCheck />
              <AlertDescription>
                {t('security:twoFactor.setup.demoNote', { code: setupData?.demoCode })}
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label>{t('security:twoFactor.setup.code')}</Label>
              <InputOTP
                maxLength={6}
                value={code}
                onChange={setCode}
                // eslint-disable-next-line jsx-a11y/no-autofocus -- entering the code is the dialog's only task
                autoFocus
                aria-label={t('security:twoFactor.setup.code')}
                containerClassName="justify-center"
              >
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot key={index} index={index} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            {setupError ? (
              <Alert variant="destructive">
                <AlertDescription>{setupError}</AlertDescription>
              </Alert>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSetupOpen(false)}>
              {t('common:actions.cancel')}
            </Button>
            <Button
              disabled={code.length !== 6 || enableMutation.isPending}
              onClick={() => {
                setSetupError(null)
                enableMutation.mutate(code)
              }}
            >
              {enableMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {t('security:twoFactor.setup.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={disableOpen}
        onOpenChange={(open) => {
          setDisableOpen(open)
          if (!open) {
            setDisableError(null)
            setPassword('')
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('security:twoFactor.disableDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('security:twoFactor.disableDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="disable-2fa-password">
              {t('security:twoFactor.disableDialog.password')}
            </Label>
            <PasswordInput
              id="disable-2fa-password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {disableError ? (
              <Alert variant="destructive">
                <AlertDescription>{disableError}</AlertDescription>
              </Alert>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisableOpen(false)}>
              {t('common:actions.cancel')}
            </Button>
            <Button
              variant="destructive"
              disabled={!password || disableMutation.isPending}
              onClick={() => {
                setDisableError(null)
                disableMutation.mutate(password)
              }}
            >
              {disableMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {t('security:twoFactor.disableDialog.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function resolveSetupError(error: unknown, t: TFunction) {
  if (error instanceof ApiError && error.code === 'INVALID_CODE') return t('auth:otp.invalidCode')
  return t('security:twoFactor.setup.error')
}

function resolveDisableError(error: unknown, t: TFunction) {
  if (error instanceof ApiError && error.code === 'INVALID_PASSWORD') {
    return t('security:password.errors.current')
  }
  return t('security:twoFactor.disableDialog.error')
}
