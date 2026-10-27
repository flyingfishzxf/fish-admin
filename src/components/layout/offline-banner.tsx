import { RefreshCw, WifiOff } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@fish-admin/react'
import { useOnlineStatus } from '@/lib/online'

export function OfflineBanner() {
  const { t } = useTranslation('errors')
  const online = useOnlineStatus()
  const wasOffline = useRef(false)

  useEffect(() => {
    if (!online) {
      wasOffline.current = true
    } else if (wasOffline.current) {
      wasOffline.current = false
      toast.success(t('offline.restored'))
    }
  }, [online, t])

  if (online) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-amber-500/25 bg-amber-500/10 px-4 py-2 text-xs text-amber-800 sm:px-6 dark:text-amber-300"
    >
      <WifiOff className="size-4 shrink-0" />
      <span className="font-medium">{t('offline.title')}</span>
      <span className="text-amber-700/80 dark:text-amber-300/80">{t('offline.description')}</span>
      <Button
        variant="outline"
        size="sm"
        className="ml-auto h-7 border-amber-500/30 bg-transparent text-amber-800 hover:bg-amber-500/10 dark:text-amber-300"
        onClick={() => window.location.reload()}
      >
        <RefreshCw className="size-3.5" />
        {t('offline.retry')}
      </Button>
    </div>
  )
}
