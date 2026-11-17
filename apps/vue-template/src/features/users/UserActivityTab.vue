<script setup lang="ts">
import { AUDIT_ACTION_TONES, type AuditTone } from '@fish-admin/contracts/audit'
import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'

import { Card, ErrorState } from '@fish-admin/vue'
import { Timeline, type TimelineItem, type TimelineTone } from '@fish-admin/vue'
import { formatDateTime } from '../../lib/format'
import { language, useT } from '../../lib/i18n'
import { ENTITY_ICONS } from '../audit/tones'
import { userActivityQueryOptions } from './queries'

const props = defineProps<{ userId: string }>()

const t = useT()
const query = useQuery(computed(() => userActivityQueryOptions(props.userId)))

const TIMELINE_TONES: Record<AuditTone, TimelineTone> = {
  success: 'success',
  info: 'info',
  warning: 'warning',
  destructive: 'destructive',
  neutral: 'default',
}

const items = computed<TimelineItem[]>(() =>
  (query.data.value?.items ?? []).map((event) => {
    // The audit drawer shows the whole metadata object; the timeline is a scan,
    // so it takes two entries and drops the actor id (already in the byline).
    const metadata = Object.entries(event.metadata)
      .filter(([key]) => key !== 'actorId')
      .slice(0, 2)
      .map(([key, value]) => `${key}: ${value}`)
      .join(' · ')

    return {
      id: event.id,
      title: t(`audit:actions.${event.action}`),
      description: `${event.actorName || t('audit:actorFallback')}${metadata ? ` · ${metadata}` : ''}`,
      timestamp: formatDateTime(event.createdAt, language.value),
      icon: ENTITY_ICONS[event.entityType],
      tone: TIMELINE_TONES[AUDIT_ACTION_TONES[event.action]],
    }
  }),
)
</script>

<template>
  <Card
    class="shadow-soft"
    :title="t('audit:activity.title')"
    :description="t('audit:activity.description')"
  >
    <div v-if="query.isPending.value" class="space-y-4" data-slot="activity-skeleton">
      <div v-for="index in 4" :key="index" class="flex gap-3">
        <div class="size-8 shrink-0 rounded-full bg-muted" />
        <div class="flex-1 space-y-2 py-1">
          <div class="h-4 w-40 rounded bg-muted" />
          <div class="h-3 w-64 rounded bg-muted" />
        </div>
      </div>
    </div>
    <ErrorState
      v-else-if="query.isError.value"
      :title="t('audit:loadError')"
      class="border-0 py-8"
      :on-retry="() => query.refetch()"
    />
    <Timeline v-else :items="items" :empty-label="t('audit:activity.empty')" />
  </Card>
</template>
