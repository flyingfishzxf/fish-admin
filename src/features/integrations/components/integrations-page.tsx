import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Boxes,
  CheckCircle2,
  Clock,
  Code2,
  CreditCard,
  Database,
  History,
  Info,
  Pencil,
  Plug,
  Plus,
  Trash2,
  Webhook,
  XCircle,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { ErrorState } from '@/components/common/error-state'
import {
  Combobox,
  PageContainer,
  Popconfirm,
  Result,
  Timeline,
  type TimelineItem,
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Segmented,
  Skeleton,
  Switch,
} from '@fish-admin/react'

import { INTEGRATION_PROVIDERS } from '@/config/integrations'
import { PERMISSION_CODES } from '@/config/permissions'
import { useCan } from '@/hooks/use-can'
import { useDocumentTitle } from '@/lib/document-title'
import { formatRelativeTime } from '@/lib/format'
import type { Integration } from '@/types'

import { deleteIntegration, updateIntegration } from '../api'
import { DEFAULT_INTEGRATIONS_SEARCH, type IntegrationsSearch } from '../search'
import { useIntegrationListQuery, useRecentDeliveriesQuery } from '../queries'
import { IntegrationDeliveryDrawer } from './integration-delivery-drawer'
import { IntegrationFormDrawer } from './integration-form-drawer'

type PageToken = number | 'start-ellipsis' | 'end-ellipsis'

const PROVIDER_ICONS: Record<string, LucideIcon> = {
  Slack: Webhook,
  GitHub: Code2,
  Stripe: CreditCard,
  Linear: Boxes,
  Datadog: Database,
  Custom: Plug,
}

function pageTokens(current: number, count: number): PageToken[] {
  if (count <= 7) return Array.from({ length: count }, (_, index) => index + 1)

  const start = Math.max(2, current - 1)
  const end = Math.min(count - 1, current + 1)
  const tokens: PageToken[] = [1]
  if (start > 2) tokens.push('start-ellipsis')
  for (let page = start; page <= end; page += 1) tokens.push(page)
  if (end < count - 1) tokens.push('end-ellipsis')
  tokens.push(count)
  return tokens
}

export function IntegrationsPage({
  search,
  onSearchChange,
}: {
  search: IntegrationsSearch
  onSearchChange: (updater: (previous: IntegrationsSearch) => IntegrationsSearch) => void
}) {
  const { t, i18n } = useTranslation('integrations')
  const queryClient = useQueryClient()
  const canManage = useCan(PERMISSION_CODES.integrationManage)
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Integration | null>(null)
  const [deliveryTarget, setDeliveryTarget] = useState<Integration | null>(null)
  useDocumentTitle(t('title'))

  const params = useMemo(
    () => ({
      page: search.page,
      pageSize: search.pageSize,
      provider: search.provider,
      enabled: search.status === 'all' ? undefined : search.status === 'enabled',
    }),
    [search.page, search.pageSize, search.provider, search.status],
  )

  const listQuery = useIntegrationListQuery(params)
  const recentQuery = useRecentDeliveriesQuery(8)
  const integrations = listQuery.data?.items ?? []
  const page = listQuery.data?.page ?? search.page
  const pageCount = listQuery.data?.pageCount ?? 1
  const total = listQuery.data?.total ?? 0

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['integrations'] })

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      updateIntegration(id, { enabled }),
    onSuccess: async (_data, variables) => {
      toast.success(t(variables.enabled ? 'toasts.enabled' : 'toasts.disabled'))
      await invalidate()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('errors.update'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteIntegration,
    onSuccess: async () => {
      toast.success(t('toasts.deleted'))
      await invalidate()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('errors.delete'))
    },
  })

  const activityItems: TimelineItem[] = (recentQuery.data?.items ?? []).map((delivery) => ({
    id: delivery.id,
    title: `${delivery.integrationName} · ${t(`events.${delivery.event}`, {
      defaultValue: delivery.event,
    })}`,
    description: t('activity.summary', {
      code: delivery.statusCode,
      duration: delivery.durationMs,
    }),
    timestamp: formatRelativeTime(delivery.createdAt, i18n.language),
    icon: delivery.status === 'success' ? CheckCircle2 : XCircle,
    tone: delivery.status === 'success' ? 'success' : 'destructive',
  }))

  const resetFilters = () => onSearchChange(() => ({ ...DEFAULT_INTEGRATIONS_SEARCH }))

  return (
    <PageContainer
      title={t('title')}
      description={t('subtitle')}
      actions={
        canManage ? (
          <Button
            onClick={() => {
              setEditTarget(null)
              setFormOpen(true)
            }}
          >
            <Plus aria-hidden />
            {t('actions.create')}
          </Button>
        ) : null
      }
    >
      <Alert>
        <Info />
        <AlertTitle>{t('demo.title')}</AlertTitle>
        <AlertDescription>{t('demo.description')}</AlertDescription>
      </Alert>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Combobox
            options={INTEGRATION_PROVIDERS.map((provider) => ({
              value: provider,
              label: provider,
            }))}
            value={search.provider ?? null}
            onChange={(value) =>
              onSearchChange((previous) => ({ ...previous, page: 1, provider: value }))
            }
            onClear={() =>
              onSearchChange((previous) => ({ ...previous, page: 1, provider: undefined }))
            }
            placeholder={t('filters.provider')}
            searchPlaceholder={t('filters.providerSearch')}
            emptyLabel={t('filters.providerEmpty')}
            clearLabel={t('filters.clear')}
            ariaLabel={t('filters.provider')}
            className="w-full sm:w-52"
          />
          <Segmented
            options={[
              { value: 'all', label: t('filters.statusAll') },
              { value: 'enabled', label: t('filters.statusEnabled') },
              { value: 'disabled', label: t('filters.statusDisabled') },
            ]}
            value={search.status}
            onValueChange={(value) =>
              onSearchChange((previous) => ({
                ...previous,
                page: 1,
                status: value as IntegrationsSearch['status'],
              }))
            }
            aria-label={t('filters.statusLabel')}
            size="sm"
          />
        </div>
        <p className="text-sm text-muted-foreground">{t('summary', { count: total })}</p>
      </div>

      {listQuery.isPending ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: search.pageSize }).map((_, index) => (
            <Skeleton key={index} className="h-60 w-full rounded-xl" />
          ))}
        </div>
      ) : listQuery.isError ? (
        <ErrorState onRetry={() => void listQuery.refetch()} />
      ) : total === 0 ? (
        <Result
          status="not-found"
          title={t('empty.title')}
          description={t('empty.description')}
          extra={
            <Button variant="outline" onClick={resetFilters}>
              {t('empty.reset')}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {integrations.map((integration) => {
            const Icon = PROVIDER_ICONS[integration.provider] ?? Plug
            const ModeIcon = integration.mode === 'immediate' ? Zap : Clock

            return (
              <Card key={integration.id} data-slot="integration-card">
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      <Icon aria-hidden className="size-5" />
                    </span>
                    <div className="min-w-0 space-y-1">
                      <CardTitle className="truncate text-base">{integration.name}</CardTitle>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{integration.provider}</Badge>
                        <Badge variant={integration.enabled ? 'secondary' : 'outline'}>
                          {t(integration.enabled ? 'status.enabled' : 'status.disabled')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {canManage ? (
                    <Switch
                      checked={integration.enabled}
                      aria-label={t('card.toggle', { name: integration.name })}
                      disabled={toggleMutation.isPending}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({ id: integration.id, enabled: checked })
                      }
                    />
                  ) : null}
                </CardHeader>

                <CardContent className="space-y-3">
                  <p className="truncate rounded-md bg-muted px-2 py-1.5 font-mono text-xs">
                    {integration.endpoint}
                  </p>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div className="min-w-0">
                      <dt className="text-xs text-muted-foreground">{t('card.event')}</dt>
                      <dd className="truncate">
                        {t(`events.${integration.event}`, { defaultValue: integration.event })}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">{t('card.mode')}</dt>
                      <dd className="flex items-center gap-1.5">
                        <ModeIcon aria-hidden className="size-3.5 text-muted-foreground" />
                        {t(`mode.${integration.mode}`)}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-xs text-muted-foreground">{t('card.lastDelivery')}</dt>
                      <dd>
                        {integration.lastDeliveryAt
                          ? formatRelativeTime(integration.lastDeliveryAt, i18n.language)
                          : t('card.never')}
                      </dd>
                    </div>
                  </dl>
                </CardContent>

                <CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
                  <span className="font-mono text-xs text-muted-foreground">
                    {integration.secretPreview}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeliveryTarget(integration)}
                    >
                      <History aria-hidden />
                      {t('card.deliveries')}
                    </Button>
                    {canManage ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditTarget(integration)
                            setFormOpen(true)
                          }}
                        >
                          <Pencil aria-hidden />
                          {t('actions.edit')}
                        </Button>
                        <Popconfirm
                          title={t('card.deleteTitle', { name: integration.name })}
                          description={t('card.deleteDescription')}
                          confirmLabel={t('actions.delete')}
                          onConfirm={() => deleteMutation.mutate(integration.id)}
                          pending={deleteMutation.isPending}
                          destructive
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t('card.delete', { name: integration.name })}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 aria-hidden />
                          </Button>
                        </Popconfirm>
                      </>
                    ) : null}
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {pageCount > 1 ? (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                aria-disabled={page <= 1}
                className={page <= 1 ? 'pointer-events-none opacity-50' : undefined}
                onClick={(event) => {
                  event.preventDefault()
                  if (page > 1) onSearchChange((previous) => ({ ...previous, page: page - 1 }))
                }}
              />
            </PaginationItem>
            {pageTokens(page, pageCount).map((token) =>
              typeof token === 'number' ? (
                <PaginationItem key={token}>
                  <PaginationLink
                    href="#"
                    isActive={token === page}
                    onClick={(event) => {
                      event.preventDefault()
                      onSearchChange((previous) => ({ ...previous, page: token }))
                    }}
                  >
                    {token}
                  </PaginationLink>
                </PaginationItem>
              ) : (
                <PaginationItem key={token}>
                  <PaginationEllipsis />
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                aria-disabled={page >= pageCount}
                className={page >= pageCount ? 'pointer-events-none opacity-50' : undefined}
                onClick={(event) => {
                  event.preventDefault()
                  if (page < pageCount)
                    onSearchChange((previous) => ({ ...previous, page: page + 1 }))
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('activity.title')}</CardTitle>
          <p className="text-sm text-muted-foreground">{t('activity.description')}</p>
        </CardHeader>
        <CardContent>
          {recentQuery.isPending ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <Timeline items={activityItems} emptyLabel={t('activity.empty')} />
          )}
        </CardContent>
      </Card>

      {formOpen ? (
        <IntegrationFormDrawer
          key={editTarget?.id ?? 'new'}
          open={formOpen}
          integration={editTarget}
          onOpenChange={setFormOpen}
        />
      ) : null}

      {deliveryTarget ? (
        <IntegrationDeliveryDrawer
          key={deliveryTarget.id}
          open
          integration={deliveryTarget}
          onOpenChange={(open) => {
            if (!open) setDeliveryTarget(null)
          }}
        />
      ) : null}
    </PageContainer>
  )
}
