<script setup lang="ts">
import type { WorkflowStep } from '@fish-admin/contracts'
import { Button, Card, EmptyState, ErrorState, Skeleton } from '@fish-admin/vue'
import { useQuery } from '@tanstack/vue-query'
import { ArrowLeft, CheckCheck, CircleX, Forward, Send } from 'lucide-vue-next'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { Timeline, type TimelineItem, type TimelineTone } from '@fish-admin/vue'
import { ApiError } from '../../lib/api-error'
import { formatCurrency, formatDateTime } from '../../lib/format'
import { language, useT } from '../../lib/i18n'
import { workflowDetailQueryOptions } from './queries'
import WorkflowCodeMark from './WorkflowCodeMark.vue'
import WorkflowComments from './WorkflowComments.vue'
import WorkflowDecisionPanel from './WorkflowDecisionPanel.vue'
import WorkflowStatusBadge from './WorkflowStatusBadge.vue'
import WorkflowTypeBadge from './WorkflowTypeBadge.vue'

const t = useT('workflows')
const route = useRoute()
const router = useRouter()

const workflowId = computed(() => String(route.params.id ?? ''))
const query = useQuery(computed(() => workflowDetailQueryOptions(workflowId.value)))
const detail = computed(() => query.data.value ?? null)

const notFound = computed(
  () =>
    query.isError.value &&
    query.error.value instanceof ApiError &&
    query.error.value.status === 404,
)

const STEP_TONES: Record<WorkflowStep['action'], TimelineTone> = {
  submitted: 'default',
  approved: 'success',
  rejected: 'destructive',
  transferred: 'info',
}

const STEP_ICONS = {
  submitted: Send,
  approved: CheckCheck,
  rejected: CircleX,
  transferred: Forward,
}

const timeline = computed<TimelineItem[]>(() =>
  (detail.value?.steps ?? []).map((step) => {
    const title =
      step.action === 'submitted'
        ? t('timeline.submitted', { name: step.actorName })
        : step.action === 'approved'
          ? t('timeline.approved', { name: step.actorName })
          : step.action === 'rejected'
            ? t('timeline.rejected', { name: step.actorName })
            : t('timeline.transferred', {
                name: step.actorName,
                approver: step.approverName ?? '—',
              })

    return {
      id: step.id,
      title,
      // An empty description would still render a line box and break the rhythm.
      description: step.comment || undefined,
      timestamp: formatDateTime(step.createdAt, language.value),
      icon: STEP_ICONS[step.action],
      tone: STEP_TONES[step.action],
    }
  }),
)

/** Raw field names on purpose: this is the payload, not a translated view. */
const snapshot = computed(() => {
  const instance = detail.value?.instance
  if (!instance) return []
  const rows: Array<{ key: string; value: string }> = [
    { key: 'code', value: instance.code },
    { key: 'type', value: instance.type },
    { key: 'status', value: instance.status },
    { key: 'initiator', value: instance.initiatorName },
  ]
  if (instance.amount !== undefined) {
    rows.push({ key: 'amount', value: formatCurrency(instance.amount, language.value) })
  }
  for (const field of instance.form) {
    rows.push({ key: `form.${field.label}`, value: field.value })
  }
  rows.push({ key: 'approvers', value: instance.approverNames.join(', ') })
  rows.push({ key: 'createdAt', value: instance.createdAt })
  if (instance.completedAt) rows.push({ key: 'completedAt', value: instance.completedAt })
  return rows
})

function backToList() {
  void router.push({ name: 'workflows' })
}
</script>

<template>
  <div class="space-y-6" data-workflow-detail>
    <div v-if="query.isPending.value" class="space-y-6">
      <Skeleton class="h-8 w-32" />
      <div class="flex items-center gap-4">
        <Skeleton class="size-14 rounded-2xl" />
        <div class="space-y-2">
          <Skeleton class="h-7 w-64" />
          <Skeleton class="h-4 w-80" />
        </div>
      </div>
      <div class="grid gap-6 lg:grid-cols-3">
        <Skeleton class="h-72 rounded-xl lg:col-span-2" />
        <Skeleton class="h-72 rounded-xl" />
      </div>
    </div>

    <template v-else-if="notFound">
      <Button variant="ghost" size="sm" class="-ms-2" @click="backToList">
        <ArrowLeft class="size-4" aria-hidden="true" />
        {{ t('detail.back') }}
      </Button>
      <EmptyState
        :icon="CircleX"
        :title="t('detail.notFoundTitle')"
        :description="t('detail.notFoundDescription')"
        data-workflow-not-found
      >
        <template #action>
          <Button variant="outline" @click="backToList">{{ t('detail.notFoundAction') }}</Button>
        </template>
      </EmptyState>
    </template>

    <template v-else-if="query.isError.value">
      <Button variant="ghost" size="sm" class="-ms-2" @click="backToList">
        <ArrowLeft class="size-4" aria-hidden="true" />
        {{ t('detail.back') }}
      </Button>
      <ErrorState :title="t('detail.notFoundTitle')" :on-retry="() => query.refetch()" />
    </template>

    <template v-else-if="detail">
      <div class="space-y-4">
        <Button variant="ghost" size="sm" class="-ms-2" data-back @click="backToList">
          <ArrowLeft class="size-4" aria-hidden="true" />
          {{ t('detail.back') }}
        </Button>

        <div class="flex flex-wrap items-start gap-4">
          <WorkflowCodeMark :code="detail.instance.code" />
          <div class="min-w-0 space-y-1">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-2xl font-semibold tracking-tight" data-workflow-title>
                {{ detail.instance.title }}
              </h1>
              <WorkflowStatusBadge :status="detail.instance.status" />
              <WorkflowTypeBadge :type="detail.instance.type" />
            </div>
            <p class="max-w-2xl text-sm text-muted-foreground">{{ detail.instance.summary }}</p>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span class="font-mono">{{ detail.instance.code }}</span>
              <span>{{ t('detail.initiatedBy', { name: detail.instance.initiatorName }) }}</span>
              <span>
                {{
                  t('detail.createdAt', {
                    date: formatDateTime(detail.instance.createdAt, language),
                  })
                }}
              </span>
              <span v-if="detail.instance.amount !== undefined">
                {{ formatCurrency(detail.instance.amount, language) }}
              </span>
              <span>
                {{
                  detail.instance.status === 'pending'
                    ? t('detail.waitingFor', { name: detail.instance.currentApproverName ?? '—' })
                    : t('detail.closed')
                }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <WorkflowDecisionPanel :detail="detail" />

      <div class="grid gap-6 lg:grid-cols-3">
        <div class="space-y-6 lg:col-span-2">
          <Card :title="t('detail.formTitle')" :description="t('detail.formDescription')">
            <dl class="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2" data-workflow-form>
              <div v-for="field in detail.instance.form" :key="field.label" class="min-w-0">
                <dt class="text-xs text-muted-foreground">{{ field.label }}</dt>
                <dd class="break-words">{{ field.value }}</dd>
              </div>
            </dl>
          </Card>

          <WorkflowComments :instance-id="detail.instance.id" :comments="detail.comments" />
        </div>

        <div class="space-y-6">
          <Card :title="t('detail.timelineTitle')" :description="t('detail.timelineDescription')">
            <Timeline :items="timeline" />
          </Card>

          <Card :title="t('detail.snapshotTitle')" :description="t('detail.snapshotDescription')">
            <dl class="space-y-2 text-xs" data-workflow-snapshot>
              <div v-for="row in snapshot" :key="row.key" class="min-w-0">
                <dt class="font-mono text-muted-foreground">{{ row.key }}</dt>
                <dd class="break-all">{{ row.value }}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </template>
  </div>
</template>
