import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Loader2, LockKeyhole, LogIn } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { StatusScreen } from '@/components/common/status-screen'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/lib/document-title'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/401')({
  component: UnauthorizedPage,
})

function UnauthorizedPage() {
  const { t } = useTranslation('errors')
  useDocumentTitle(t('status.unauthorized.title'))
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)

  async function handleSignIn() {
    setPending(true)
    await logout()
    await navigate({ to: '/login' })
  }

  return (
    <StatusScreen
      code="401"
      icon={LockKeyhole}
      tone="warning"
      title={t('status.unauthorized.title')}
      description={t('status.unauthorized.description')}
      hint={t('status.unauthorized.hint')}
      actions={
        <>
          <Button onClick={() => void handleSignIn()} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
            {t('status.unauthorized.action')}
          </Button>
          <Button asChild variant="outline">
            <Link to="/">{t('goHome')}</Link>
          </Button>
        </>
      }
    />
  )
}
