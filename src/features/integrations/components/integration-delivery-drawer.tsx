import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, RefreshCw, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { DatePicker } from '@/components/enterprise/date-picker/date-picker'
import { JsonViewer } from '@/components/enterprise/json-viewer/json-viewer'
import { List } from '@/components/enterprise/list/list'
import { Popconfirm } from '@/components/enterprise/popconfirm/popconfirm'
import { Result } from '@/components/enterprise/result/result'
import { TimePicker } from '@/components/enterprise/time-picker/time-picker'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { formatDateTime, formatRelativeTime } from '@/lib/format'
import type { Integration } from '@/types'

import { retryDelivery } from '../api'
import { useIntegrationDeliveriesQuery } from '../queries'

export function IntegrationDeliveryDrawer({
  integration,
  open,
  onOpenChange,
}: {
  integration: Integration | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t, i18n } = useTranslation('integrations')
  const queryClient = useQueryClient()
  const query = useIntegrationDeliveriesQuery(open ? (integration?.id ?? null) : null)
  const [dateFilter, setDateFilter] = useState<string | undefined>()
  const [timeFilter, setTimeFilter] = useState<string | undefined>()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const retryMutation = useMutation({
    mutationFn: (deliveryId: string) => retryDelivery(integration?.id ?? '', deliveryId),
    onSuccess: async (delivery) => {
      setSelectedId(delivery.id)
      toast.success(t('deliveries.retrySuccess'))
      await queryClient.invalidateQueries({ queryKey: ['integrations'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('errors.retry'))
    },
  })

  const since = useMemo(() => {
    if (!dateFilter) return undefined
    const value = new Date(`${dateFilter}T${timeFilter ?? '00:00'}:00`)
    return Number.isNaN(value.getTime()) ? undefined : value.getTime()
  }, [dateFilter, timeFilter])

  const filtered = useMemo(() => {
    const deliveries = query.data?.items ?? []
    return since === undefined
      ? deliveries
      : deliveries.filter((delivery) => new Date(delivery.createdAt).getTime() >= since)
  }, [query.data, since])
  const selected = filtered.find((delivery) => delivery.id === selectedId) ?? filtered[0] ?? null

  const listItems = filtered.map((delivery) => ({
    id: delivery.id,
    title: t(`events.${delivery.event}`, { defaultValue: delivery.event }),
    description: `${delivery.statusCode} · ${delivery.durationMs} ms`,
    meta: formatRelativeTime(delivery.createdAt, i18n.language),
    icon: delivery.status === 'success' ? CheckCircle2 : XCircle,
  }))

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="w-full sm:max-w-xl">
        <DrawerHeader className="border-b pr-12">
          <DrawerTitle>{t('deliveries.title', { name: integration?.name ?? '' })}</DrawerTitle>
          <DrawerDescription>
            {t('deliveries.description', { endpoint: integration?.endpoint ?? '' })}
          </DrawerDescription>
        </DrawerHeader>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div className="space-y-2">
              <Label>{t('deliveries.filters.date')}</Label>
              <DatePicker
                value={dateFilter}
                onChange={(value) => setDateFilter(value)}
                placeholder={t('deliveries.filters.datePlaceholder')}
                ariaLabel={t('deliveries.filters.date')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('deliveries.filters.time')}</Label>
              <TimePicker
                value={timeFilter}
                onChange={(value) => setTimeFilter(value)}
                placeholder={t('deliveries.filters.timePlaceholder')}
                ariaLabel={t('deliveries.filters.time')}
                disabled={!dateFilter}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setDateFilter(undefined)
                setTimeFilter(undefined)
              }}
              disabled={!dateFilter && !timeFilter}
            >
              {t('deliveries.filters.reset')}
            </Button>
          </div>

          {query.isPending ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Spinner />
              {t('deliveries.loading')}
            </div>
          ) : filtered.length === 0 ? (
            <Result
              status="not-found"
              title={t('deliveries.emptyTitle')}
              description={t('deliveries.emptyDescription')}
            />
          ) : (
            <>
              <List
                ariaLabel={t('deliveries.listLabel')}
                items={listItems}
                selectedId={selected?.id}
                onItemClick={(item) => setSelectedId(item.id)}
                emptyLabel={t('deliveries.emptyTitle')}
              />

              {selected ? (
                <section className="space-y-4">
                  <Result
                    status={selected.status === 'success' ? 'success' : 'error'}
                    title={t(`deliveries.status.${selected.status}`)}
                    description={t('deliveries.resultSummary', {
                      code: selected.statusCode,
                      duration: selected.durationMs,
                    })}
                    extra={
                      selected.status === 'failed' ? (
                        <Popconfirm
                          title={t('deliveries.retryConfirmTitle')}
                          description={t('deliveries.retryConfirmDescription')}
                          confirmLabel={t('deliveries.retry')}
                          onConfirm={() => retryMutation.mutate(selected.id)}
                          pending={retryMutation.isPending}
                        >
                          <Button variant="outline" size="sm" disabled={retryMutation.isPending}>
                            <RefreshCw aria-hidden />
                            {t('deliveries.retry')}
                          </Button>
                        </Popconfirm>
                      ) : null
                    }
                  />

                  <dl className="grid gap-3 rounded-xl border p-4 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        {t('deliveries.deliveryId')}
                      </dt>
                      <dd className="font-mono text-xs break-all">{selected.id}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        {t('deliveries.deliveredAt')}
                      </dt>
                      <dd>{formatDateTime(selected.createdAt, i18n.language)}</dd>
                    </div>
                  </dl>

                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">{t('deliveries.payload')}</h3>
                    <JsonViewer
                      value={selected.payload}
                      ariaLabel={t('deliveries.payload')}
                      className="max-h-80 overflow-auto rounded-xl border bg-muted/40 p-3"
                    />
                  </div>
                </section>
              ) : null}
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
