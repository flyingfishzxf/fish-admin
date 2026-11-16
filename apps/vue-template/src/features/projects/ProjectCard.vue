<script setup lang="ts">
import type { Project } from '@fish-admin/contracts'
import { Button } from '@fish-admin/vue'
import { Archive, ArrowUpRight, CalendarClock, Users } from 'lucide-vue-next'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import ProgressBar from '../../components/ui/ProgressBar.vue'
import { formatCurrency, formatDate } from '../../lib/format'
import { useT } from '../../lib/i18n'
import ProjectKeyMark from './ProjectKeyMark.vue'
import ProjectPriorityBadge from './ProjectPriorityBadge.vue'
import ProjectStatusBadge from './ProjectStatusBadge.vue'

const props = defineProps<{
  project: Project
  language: string
  canManage: boolean
  archiving?: boolean
}>()

const emit = defineEmits<{ archive: [project: Project] }>()

const t = useT('projects')

const totalTasks = computed(() =>
  Object.values(props.project.taskCounts).reduce((sum, count) => sum + count, 0),
)
const doneTasks = computed(() => props.project.taskCounts.done)
const spentPercent = computed(() =>
  props.project.budget > 0 ? Math.round((props.project.spent / props.project.budget) * 100) : 0,
)
</script>

<template>
  <article
    class="flex h-full flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm transition-colors hover:border-primary/40"
    data-project-card
    :data-project-id="props.project.id"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="flex min-w-0 items-start gap-3">
        <ProjectKeyMark :project-key="props.project.key" />
        <div class="min-w-0 space-y-1">
          <RouterLink
            :to="{ name: 'project-detail', params: { id: props.project.id } }"
            class="block truncate font-semibold hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {{ props.project.name }}
          </RouterLink>
          <p class="line-clamp-2 text-sm text-muted-foreground">{{ props.project.description }}</p>
        </div>
      </div>
      <Button
        v-if="props.canManage"
        variant="ghost"
        size="icon-sm"
        :aria-label="t('card.archive')"
        :disabled="props.archiving"
        data-project-archive
        @click="emit('archive', props.project)"
      >
        <Archive class="size-4" aria-hidden="true" />
      </Button>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <ProjectStatusBadge :status="props.project.status" />
      <ProjectPriorityBadge :priority="props.project.priority" />
      <span
        v-for="tag in props.project.tags.slice(0, 2)"
        :key="tag"
        class="text-xs text-muted-foreground"
      >
        #{{ tag }}
      </span>
    </div>

    <div class="space-y-1.5">
      <div class="flex items-center justify-between text-xs text-muted-foreground">
        <span>{{ t('card.tasks', { done: doneTasks, total: totalTasks }) }}</span>
        <span>{{ props.project.progress }}%</span>
      </div>
      <ProgressBar :value="props.project.progress" :ariaLabel="t('detail.overview.progress')" />
    </div>

    <div class="flex items-center justify-between text-xs text-muted-foreground">
      <span>
        {{
          t('card.budget', {
            spent: formatCurrency(props.project.spent, props.language),
            budget: formatCurrency(props.project.budget, props.language),
          })
        }}
      </span>
      <span>{{ spentPercent }}%</span>
    </div>

    <div
      class="mt-auto flex items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground"
    >
      <div class="flex min-w-0 items-center gap-3">
        <span class="truncate font-medium text-foreground" data-project-owner>
          {{ props.project.ownerName }}
        </span>
        <span class="inline-flex items-center gap-1">
          <Users class="size-3.5" aria-hidden="true" />
          {{ props.project.memberIds.length }}
        </span>
        <span class="inline-flex items-center gap-1">
          <CalendarClock class="size-3.5" aria-hidden="true" />
          {{
            formatDate(props.project.dueDate, props.language, { month: 'short', day: 'numeric' })
          }}
        </span>
      </div>
      <Button variant="ghost" size="icon-sm" as-child>
        <RouterLink
          :to="{ name: 'project-detail', params: { id: props.project.id } }"
          :aria-label="t('card.open')"
        >
          <ArrowUpRight class="size-4" aria-hidden="true" />
        </RouterLink>
      </Button>
    </div>
  </article>
</template>
