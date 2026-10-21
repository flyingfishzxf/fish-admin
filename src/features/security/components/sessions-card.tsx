import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Laptop, Loader2, LogOut, Monitor, RefreshCw, Smartphone, Tablet } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getSessionsRequest,
  revokeOtherSessionsRequest,
  revokeSessionRequest,
} from '@/features/auth/api'
import type { AuthSession } from '@/types'
import { formatDateTime, formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'

const SESSIONS_KEY = ['auth', 'sessions'] as const

function SessionIcon({ os }: { os: string }) {
  if (os === 'iOS' || os === 'Android') return <Smartphone className="size-5" />
  if (os === 'iPadOS') return <Tablet className="size-5" />
  if (os === 'Windows' || os === 'macOS' || os === 'Linux') return <Laptop className="size-5" />
  return <Monitor className="size-5" />
}

export function SessionsCard() {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'
  const queryClient = useQueryClient()
  const sessionsQuery = useQuery({ queryKey: SESSIONS_KEY, queryFn: getSessionsRequest })
  const [revokeTarget, setRevokeTarget] = useState<AuthSession | null>(null)
  const [revokeOthersOpen, setRevokeOthersOpen] = useState(false)

  const sessions = [...(sessionsQuery.data ?? [])].sort((a, b) => {
    if (a.current !== b.current) return a.current ? -1 : 1
    return new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()
  })
  const otherSessions = sessions.filter((session) => !session.current)

  const revokeMutation = useMutation({
    mutationFn: revokeSessionRequest,
    onSuccess: () => {
      setRevokeTarget(null)
      toast.success(t('security:sessions.revokeSuccess'))
      void queryClient.invalidateQueries({ queryKey: SESSIONS_KEY })
    },
    onError: () => toast.error(t('security:sessions.revokeError')),
  })

  const revokeOthersMutation = useMutation({
    mutationFn: revokeOtherSessionsRequest,
    onSuccess: () => {
      setRevokeOthersOpen(false)
      toast.success(t('security:sessions.revokeAllSuccess'))
      void queryClient.invalidateQueries({ queryKey: SESSIONS_KEY })
    },
    onError: () => toast.error(t('security:sessions.revokeError')),
  })

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2">
              <Monitor className="size-4" />
              {t('security:sessions.title')}
            </CardTitle>
            <CardDescription>{t('security:sessions.description')}</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={otherSessions.length === 0 || revokeOthersMutation.isPending}
            onClick={() => setRevokeOthersOpen(true)}
          >
            {revokeOthersMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LogOut className="size-4" />
            )}
            {t('security:sessions.revokeOthers')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sessionsQuery.isPending ? (
          <div className="space-y-3">
            {[0, 1].map((index) => (
              <Skeleton key={index} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : sessionsQuery.isError ? (
          <Alert variant="destructive">
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
              {t('security:sessions.loadError')}
              <Button variant="outline" size="sm" onClick={() => void sessionsQuery.refetch()}>
                <RefreshCw className="size-4" />
                {t('common:actions.retry')}
              </Button>
            </AlertDescription>
          </Alert>
        ) : sessions.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            {t('security:sessions.empty')}
          </p>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                'flex flex-wrap items-start justify-between gap-4 rounded-xl border p-4',
                session.current && 'border-primary/25 bg-primary/[0.03]',
              )}
            >
              <div className="flex items-start gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <SessionIcon os={session.os} />
                </span>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">
                      {session.browser} · {session.os}
                    </p>
                    {session.current ? (
                      <Badge variant="secondary">{t('security:sessions.current')}</Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('security:sessions.lastActive', {
                      time: formatRelativeTime(session.lastActiveAt, language),
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('security:sessions.created', {
                      time: formatDateTime(session.createdAt, language),
                    })}
                    {' · '}
                    {t('security:sessions.ip', { ip: session.ip })}
                  </p>
                </div>
              </div>
              {session.current ? null : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setRevokeTarget(session)}
                >
                  <LogOut className="size-4" />
                  {t('security:sessions.revoke')}
                </Button>
              )}
            </div>
          ))
        )}
      </CardContent>

      <AlertDialog
        open={revokeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('security:sessions.confirmRevoke.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('security:sessions.confirmRevoke.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revokeMutation.isPending}>
              {t('common:actions.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={revokeMutation.isPending}
              onClick={(event) => {
                event.preventDefault()
                if (revokeTarget) revokeMutation.mutate(revokeTarget.id)
              }}
            >
              {revokeMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {t('security:sessions.confirmRevoke.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={revokeOthersOpen} onOpenChange={setRevokeOthersOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('security:sessions.confirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('security:sessions.confirm.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revokeOthersMutation.isPending}>
              {t('common:actions.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={revokeOthersMutation.isPending}
              onClick={(event) => {
                event.preventDefault()
                revokeOthersMutation.mutate()
              }}
            >
              {revokeOthersMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {t('security:sessions.confirm.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
