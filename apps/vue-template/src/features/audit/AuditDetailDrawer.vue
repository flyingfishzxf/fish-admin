<script setup lang="ts">
import type { AuditAction, AuditEvent } from '@fish-admin/contracts'
import { AUDIT_ACTION_TONES } from '@fish-admin/contracts/audit'
import { useQuery } from '@tanstack/vue-query'
import { Badge, ErrorState, Skeleton, cn } from '@fish-admin/vue'
import { computed } from 'vue'

import DetailDrawer from '../../components/common/DetailDrawer.vue'
import { formatDateTime } from '../../lib/format'
import { language, useT } from '../../lib/i18n'
import { auditEventQueryOptions } from './queries'

const props = defineProps<{ eventId: string | null }>()
const emit = defineEmits<{ close: [] }>()

const t = useT('audit')

const query = useQuery(computed(() => auditEventQueryOptions(props.eventId)))
const event = computed<AuditEvent | null>(() => query.data.value?.event ?? null)
const related = computed<AuditEvent[]>(() => query.data.value?.related ?? [])
const metadata = computed(() => Object.entries(event.value?.metadata ?? {}))

const TONE_CLASSES: Record<string, string> = {
  success: 'border-chart-3/30 bg-chart-3/12 text-chart-3-foreground',
  info: 'border-chart-1/30 bg-chart-1/12 text-chart-1-foreground',
  warning: 'border-chart-4/30 bg-chart-4/14 text-chart-4-foreground',
  destructive: 'border-destructive/25 bg-destructive/10 text-destructive',
  neutral: 'border-border bg-muted text-muted-foreground',
}

function actionLabel(action: AuditAction) {
  return t(`actions.${action}`)
}

function toneClass(action: AuditAction) {
  return TONE_CLASSES[AUDIT_ACTION_TONES[action]] ?? TONE_CLASSES.neutral
}
</script>

<template>
  <DetailDrawer
    :open="Boolean(eventId)"
    :title="t('detail.title')"
    :description="t('detail.description')"
    @update:open="!$event && emit('close')"
  >
    <div v-if="query.isPending.value" class="space-y-6">
      <div class="grid grid-cols-2 gap-4">
        <div v-for="index in 4" :key="index" class="space-y-2">
          <Skeleton class="h-3 w-16" />
          <Skeleton class="h-4 w-28" />
        </div>
      </div>
      <Skeleton class="h-24 w-full rounded-xl" />
      <Skeleton class="h-40 w-full rounded-xl" />
    </div>
    <ErrorState
      v-else-if="query.isError.value"
      :title="t('loadError')"
      class="border-0 py-10"
      :on-retry="() => query.refetch()"
    />
    <div v-else-if="event" class="space-y-6">
      <dl class="grid grid-cols-2 gap-4">
        <div class="col-span-2 space-y-1">
          <dt class="text-xs text-muted-foreground">{{ t('columns.entity') }}</dt>
          <dd class="flex flex-wrap items-center gap-2">
            <span class="text-sm font-medium">{{ event.entityLabel }}</span>
            <span class="text-xs text-muted-foreground">
              {{ t(`entities.${event.entityType}`) }}
            </span>
          </dd>
        </div>
        <div class="space-y-1">
          <dt class="text-xs text-muted-foreground">{{ t('columns.action') }}</dt>
          <dd>
            <Badge variant="outline" :class="cn('gap-1 font-normal', toneClass(event.action))">
              {{ actionLabel(event.action) }}
            </Badge>
          </dd>
        </div>
        <div class="space-y-1">
          <dt class="text-xs text-muted-foreground">{{ t('columns.actor') }}</dt>
          <dd class="text-sm">{{ event.actorName || t('actorFallback') }}</dd>
        </div>
        <div class="col-span-2 space-y-1">
          <dt class="text-xs text-muted-foreground">{{ t('columns.time') }}</dt>
          <dd class="text-sm">{{ formatDateTime(event.createdAt, language) }}</dd>
        </div>
        <div class="col-span-2 space-y-1">
          <dt class="text-xs text-muted-foreground">{{ t('detail.eventId') }}</dt>
          <dd>
            <code class="rounded bg-muted px-1.5 py-0.5 text-xs break-all">{{ event.id }}</code>
          </dd>
        </div>
      </dl>

      <section class="space-y-2">
        <h3 class="text-sm font-semibold">{{ t('detail.metadata') }}</h3>
        <dl
          v-if="metadata.length"
          :aria-label="t('detail.metadata')"
          data-slot="audit-metadata"
          class="space-y-1 rounded-xl bg-muted/40 p-3 font-mono text-xs"
        >
          <div v-for="[key, value] in metadata" :key="key" class="flex flex-wrap gap-2">
            <dt class="text-muted-foreground">{{ key }}</dt>
            <dd class="break-all">{{ value }}</dd>
          </div>
        </dl>
        <p v-else class="text-sm text-muted-foreground">{{ t('detail.noMetadata') }}</p>
      </section>

      <section class="space-y-2">
        <h3 class="text-sm font-semibold">{{ t('detail.related') }}</h3>
        <ul v-if="related.length" :aria-label="t('detail.related')" class="space-y-3">
          <li v-for="item in related" :key="item.id" class="border-s-2 ps-3">
            <p class="text-sm font-medium">{{ actionLabel(item.action) }}</p>
            <p class="text-xs text-muted-foreground">
              {{ item.actorName || t('actorFallback') }} ·
              {{ formatDateTime(item.createdAt, language) }}
            </p>
          </li>
        </ul>
        <p v-else class="text-sm text-muted-foreground">{{ t('detail.noRelated') }}</p>
      </section>
    </div>
  </DetailDrawer>
</template>
