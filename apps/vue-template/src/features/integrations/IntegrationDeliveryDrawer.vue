<script setup lang="ts">
import type { Integration, IntegrationDelivery } from '@fish-admin/contracts'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { Badge, Button, ErrorState, Skeleton } from '@fish-admin/vue'
import { RotateCcw } from 'lucide-vue-next'
import { computed, ref } from 'vue'

import DetailDrawer from '../../components/common/DetailDrawer.vue'
import { formatDateTime } from '../../lib/format'
import { language, useT } from '../../lib/i18n'
import { retryDelivery } from './api'
import { integrationDeliveriesQueryOptions, integrationKeys } from './queries'

const props = defineProps<{ integration: Integration | null }>()
const emit = defineEmits<{ close: []; retried: [delivery: IntegrationDelivery] }>()

const t = useT('integrations')
const queryClient = useQueryClient()

const query = useQuery(
  computed(() => integrationDeliveriesQueryOptions(props.integration?.id ?? null)),
)
const deliveries = computed<IntegrationDelivery[]>(() => query.data.value?.items ?? [])

const retryingId = ref<string | null>(null)
const feedback = ref<string | null>(null)
const failure = ref<string | null>(null)

async function replay(delivery: IntegrationDelivery) {
  const integration = props.integration
  if (!integration || retryingId.value) return
  retryingId.value = delivery.id
  feedback.value = null
  failure.value = null
  try {
    const replayOf = await retryDelivery(integration.id, delivery.id)
    // A replay appends a delivery, so the history has to come from the server.
    await queryClient.invalidateQueries({ queryKey: integrationKeys.all })
    feedback.value = t('deliveries.retrySuccess')
    emit('retried', replayOf)
  } catch {
    failure.value = t('errors.retry')
  } finally {
    retryingId.value = null
  }
}

function statusLabel(delivery: IntegrationDelivery) {
  return delivery.status === 'success'
    ? t('deliveries.status.success')
    : t('deliveries.status.failed')
}
</script>

<template>
  <DetailDrawer
    :open="Boolean(integration)"
    :title="t('deliveries.title', { name: integration?.name ?? '' })"
    :description="
      integration ? t('deliveries.description', { endpoint: integration.endpoint }) : undefined
    "
    @update:open="!$event && emit('close')"
  >
    <div class="space-y-4">
      <p v-if="feedback" role="status" class="text-sm text-success">{{ feedback }}</p>
      <p v-if="failure" role="alert" class="text-sm text-destructive">{{ failure }}</p>

      <div v-if="query.isPending.value" class="space-y-3" aria-busy="true">
        <p class="sr-only">{{ t('deliveries.loading') }}</p>
        <Skeleton v-for="index in 4" :key="index" class="h-16 w-full rounded-lg" />
      </div>
      <ErrorState
        v-else-if="query.isError.value"
        :title="t('errors.save')"
        class="border-0 py-8"
        :on-retry="() => query.refetch()"
      />
      <div v-else-if="!deliveries.length" class="space-y-1 py-8 text-center">
        <p class="text-sm font-semibold">{{ t('deliveries.emptyTitle') }}</p>
        <p class="text-sm text-muted-foreground">{{ t('deliveries.emptyDescription') }}</p>
      </div>
      <ul v-else :aria-label="t('deliveries.listLabel')" class="space-y-3">
        <li
          v-for="delivery in deliveries"
          :key="delivery.id"
          :data-delivery-id="delivery.id"
          class="space-y-2 rounded-xl border p-3"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <Badge :variant="delivery.status === 'success' ? 'secondary' : 'destructive'">
              {{ statusLabel(delivery) }}
            </Badge>
            <span class="text-xs text-muted-foreground">
              {{
                t('deliveries.resultSummary', {
                  code: delivery.statusCode,
                  duration: delivery.durationMs,
                })
              }}
            </span>
          </div>
          <dl class="grid gap-1 text-xs">
            <div class="flex flex-wrap gap-1">
              <dt class="text-muted-foreground">{{ t('deliveries.deliveredAt') }}</dt>
              <dd>{{ formatDateTime(delivery.createdAt, language) }}</dd>
            </div>
            <div class="flex flex-wrap gap-1">
              <dt class="text-muted-foreground">{{ t('deliveries.deliveryId') }}</dt>
              <dd>
                <code class="rounded bg-muted px-1 py-0.5 break-all">{{ delivery.id }}</code>
              </dd>
            </div>
          </dl>
          <details class="text-xs">
            <summary class="cursor-pointer text-muted-foreground">
              {{ t('deliveries.payload') }}
            </summary>
            <pre class="mt-1 overflow-auto rounded bg-muted/40 p-2 text-[11px]">{{
              JSON.stringify(delivery.payload, null, 2)
            }}</pre>
          </details>
          <Button
            variant="outline"
            size="sm"
            :disabled="retryingId === delivery.id"
            :data-action="'retry-delivery'"
            @click="replay(delivery)"
          >
            <RotateCcw class="size-3.5" aria-hidden="true" />
            {{ t('deliveries.retry') }}
          </Button>
        </li>
      </ul>
    </div>
  </DetailDrawer>
</template>
