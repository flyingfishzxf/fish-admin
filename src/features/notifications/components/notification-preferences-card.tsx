import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Info } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { List } from '@/components/enterprise/list/list'
import { TimePicker } from '@/components/enterprise/time-picker/time-picker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import type { NotificationPreferences } from '@/types'

import { updateNotificationPreferences } from '../api'
import { useNotificationPreferencesQuery } from '../queries'

const DIGESTS: NotificationPreferences['digest'][] = ['off', 'daily', 'weekly']
const CHANNELS = ['inApp', 'email', 'push'] as const

export function NotificationPreferencesCard() {
  const { t } = useTranslation('notifications')
  const query = useNotificationPreferencesQuery()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<NotificationPreferences>()

  useEffect(() => {
    if (query.data) setDraft(query.data)
  }, [query.data])

  const saveMutation = useMutation({
    mutationFn: (input: NotificationPreferences) => updateNotificationPreferences(input),
    onSuccess: (data) => {
      setDraft(data)
      queryClient.setQueryData(['notifications', 'preferences'], data)
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success(t('preferences.saved'))
    },
    onError: () => toast.error(t('preferences.saveFailed')),
  })

  if (!draft) return null

  const dirty = JSON.stringify(draft) !== JSON.stringify(query.data)

  function patch(next: Partial<NotificationPreferences>) {
    setDraft((current) => (current ? { ...current, ...next } : current))
  }

  function patchChannel(key: (typeof CHANNELS)[number], checked: boolean) {
    setDraft((current) =>
      current ? { ...current, channels: { ...current.channels, [key]: checked } } : current,
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>{t('preferences.title')}</CardTitle>
            <CardDescription>{t('preferences.description')}</CardDescription>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t('preferences.quietHelp')}
                className="text-muted-foreground"
              >
                <Info className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="text-sm">
              {t('preferences.quietHelp')}
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium">{t('preferences.quietHours')}</p>
            <div className="flex flex-wrap items-center gap-2">
              <TimePicker
                value={draft.quietStart}
                onChange={(value) => {
                  if (value) patch({ quietStart: value })
                }}
                placeholder={t('preferences.quietStart')}
                ariaLabel={t('preferences.quietStart')}
              />
              <span aria-hidden className="text-muted-foreground">
                –
              </span>
              <TimePicker
                value={draft.quietEnd}
                onChange={(value) => {
                  if (value) patch({ quietEnd: value })
                }}
                placeholder={t('preferences.quietEnd')}
                ariaLabel={t('preferences.quietEnd')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">{t('preferences.digest')}</p>
            <RadioGroup
              value={draft.digest}
              onValueChange={(value) =>
                patch({ digest: value as NotificationPreferences['digest'] })
              }
              className="flex flex-wrap gap-4"
              aria-label={t('preferences.digest')}
            >
              {DIGESTS.map((digest) => (
                <div key={digest} className="flex items-center gap-2">
                  <RadioGroupItem value={digest} id={`digest-${digest}`} />
                  <Label htmlFor={`digest-${digest}`} className="font-normal">
                    {t(`preferences.digests.${digest}`)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">{t('preferences.channels')}</p>
          <List
            ariaLabel={t('preferences.channels')}
            emptyLabel={t('empty.title')}
            items={CHANNELS.map((channel) => ({
              id: channel,
              title: t(`preferences.channelLabels.${channel}`),
              description: t(`preferences.channelDescriptions.${channel}`),
              actions: (
                <Switch
                  checked={draft.channels[channel]}
                  onCheckedChange={(checked) => patchChannel(channel, checked)}
                  aria-label={t(`preferences.channelLabels.${channel}`)}
                />
              ),
            }))}
          />
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            variant="ghost"
            onClick={() => setDraft(query.data)}
            disabled={!dirty || saveMutation.isPending}
          >
            {t('actions.resetPreferences')}
          </Button>
          <Button
            onClick={() => draft && saveMutation.mutate(draft)}
            disabled={!dirty || saveMutation.isPending}
          >
            {t('actions.savePreferences')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
