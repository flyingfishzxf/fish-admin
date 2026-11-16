<script setup lang="ts">
import type { ProjectDetail } from '@fish-admin/contracts'
import { Badge, Button, Checkbox, Skeleton } from '@fish-admin/vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { CalendarClock, Paperclip, UploadCloud, X } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'

import Card from '../../components/ui/Card.vue'
import Dropzone from '../../components/ui/Dropzone.vue'
import Separator from '../../components/ui/Separator.vue'
import Timeline, { type TimelineItem, type TimelineTone } from '../../components/ui/Timeline.vue'
import { AUDIT_ACTION_TONES, type AuditTone } from '@fish-admin/contracts/audit'
import { formatDate, formatDateTime } from '../../lib/format'
import { language, useT } from '../../lib/i18n'
import { ENTITY_ICONS } from '../audit/tones'
import { removeProjectAttachment, toggleMilestone, uploadProjectAttachment } from './api'
import ProjectPriorityBadge from './ProjectPriorityBadge.vue'
import ProjectStatusBadge from './ProjectStatusBadge.vue'
import { projectActivityQueryOptions } from './queries'
import { groupMilestones } from './utils'

const props = defineProps<{ detail: ProjectDetail; canManage: boolean }>()

const t = useT('projects')
const queryClient = useQueryClient()
const uploading = ref(false)
const uploadError = ref('')

const project = computed(() => props.detail.project)
const groups = computed(() => groupMilestones(props.detail.milestones))
const timelineTones: Record<AuditTone, TimelineTone> = {
  success: 'success',
  info: 'info',
  warning: 'warning',
  destructive: 'destructive',
  neutral: 'default',
}

const activity = useQuery(computed(() => projectActivityQueryOptions(project.value.id)))
const timeline = computed<TimelineItem[]>(() =>
  (activity.data.value?.items ?? []).map((event) => ({
    id: event.id,
    title: t(`audit:actions.${event.action}`),
    description: [event.actorName, event.entityLabel].filter(Boolean).join(' · '),
    timestamp: formatDateTime(event.createdAt, language.value),
    icon: ENTITY_ICONS[event.entityType],
    tone: timelineTones[AUDIT_ACTION_TONES[event.action]],
  })),
)

function invalidate() {
  return queryClient.invalidateQueries({ queryKey: ['projects'] })
}

const milestoneMutation = useMutation({
  mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
    toggleMilestone(project.value.id, id, completed),
  onSuccess: () => {
    void invalidate()
  },
  onError: () => {
    showError.value = t('common:states.error.title')
  },
})

const detachMutation = useMutation({
  mutationFn: (fileId: string) => removeProjectAttachment(project.value.id, fileId),
  onSuccess: () => {
    void invalidate()
    void queryClient.invalidateQueries({ queryKey: ['audit-events'] })
  },
})

const showError = ref('')

// Toggling a day means "complete every milestone on it", and a day that is
// already complete clears all of them — the same contract as the calendar cell.
function toggleGroup(date: string) {
  if (!props.canManage) return
  const group = groups.value.find((entry) => entry.date === date)
  if (!group) return
  const next = !group.completed
  for (const milestone of group.milestones) {
    milestoneMutation.mutate({ id: milestone.id, completed: next })
  }
}

async function onFile(file: File) {
  uploading.value = true
  uploadError.value = ''
  try {
    const dataUrl = file.size <= 256_000 ? await readAsDataUrl(file) : undefined
    await uploadProjectAttachment(project.value.id, {
      name: file.name,
      mime: file.type || 'application/octet-stream',
      size: file.size,
      dataUrl,
    })
    await invalidate()
    await queryClient.invalidateQueries({ queryKey: ['audit-events'] })
  } catch {
    uploadError.value = t('detail.overview.uploadFailed')
  } finally {
    uploading.value = false
  }
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('read-failed'))
    reader.readAsDataURL(file)
  })
}

function fileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** exponent).toFixed(1)} ${units[exponent]}`
}

watch(
  () => project.value.id,
  () => {
    showError.value = ''
    uploadError.value = ''
  },
)
</script>

<template>
  <div class="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]" data-overview-tab>
    <div class="space-y-4">
      <Card :title="t('detail.overview.details')">
        <dl class="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt class="text-xs text-muted-foreground">{{ t('detail.overview.status') }}</dt>
            <dd class="pt-1"><ProjectStatusBadge :status="project.status" /></dd>
          </div>
          <div>
            <dt class="text-xs text-muted-foreground">{{ t('detail.overview.priority') }}</dt>
            <dd class="pt-1"><ProjectPriorityBadge :priority="project.priority" /></dd>
          </div>
          <div>
            <dt class="text-xs text-muted-foreground">{{ t('detail.overview.progress') }}</dt>
            <dd class="pt-1">{{ project.progress }}%</dd>
          </div>
          <div>
            <dt class="text-xs text-muted-foreground">{{ t('detail.overview.owner') }}</dt>
            <dd class="pt-1">{{ project.ownerName }}</dd>
          </div>
          <div>
            <dt class="text-xs text-muted-foreground">{{ t('detail.overview.startDate') }}</dt>
            <dd class="pt-1">
              {{ formatDate(project.startDate, language, { dateStyle: 'medium' }) }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-muted-foreground">{{ t('detail.overview.dueDate') }}</dt>
            <dd class="pt-1">
              {{ formatDate(project.dueDate, language, { dateStyle: 'medium' }) }}
            </dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="text-xs text-muted-foreground">{{ t('detail.overview.department') }}</dt>
            <dd class="pt-1">
              {{
                project.departmentName
                  ? t(`common:departments.${project.departmentName}`, {
                      defaultValue: project.departmentName,
                    })
                  : '—'
              }}
            </dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="text-xs text-muted-foreground">{{ t('detail.overview.tags') }}</dt>
            <dd class="flex flex-wrap gap-1.5 pt-1">
              <Badge v-for="tag in project.tags" :key="tag" variant="secondary">#{{ tag }}</Badge>
              <span v-if="project.tags.length === 0" class="text-muted-foreground">
                {{ t('detail.overview.noTags') }}
              </span>
            </dd>
          </div>
        </dl>
      </Card>

      <Card
        :title="t('detail.overview.milestones')"
        :description="t('detail.overview.milestonesDescription')"
      >
        <p v-if="groups.length === 0" class="text-sm text-muted-foreground">
          {{ t('detail.overview.noMilestones') }}
        </p>
        <div v-else class="space-y-3">
          <div
            v-for="group in groups"
            :key="group.date"
            class="rounded-lg border p-3"
            :data-milestone-group="group.date"
            :data-completed="group.completed || undefined"
            :class="group.completed && 'bg-muted/30'"
          >
            <div class="flex items-center justify-between gap-2 pb-2">
              <span class="inline-flex items-center gap-1.5 text-sm font-medium">
                <CalendarClock class="size-4 text-muted-foreground" aria-hidden="true" />
                {{ formatDate(group.date, language, { dateStyle: 'medium' }) }}
              </span>
              <label class="flex items-center gap-2 text-xs text-muted-foreground">
                <Checkbox
                  :model-value="group.completed"
                  :disabled="!canManage"
                  :aria-label="`${t('detail.overview.milestones')} ${group.date}`"
                  :data-milestone-toggle="group.date"
                  @update:modelValue="toggleGroup(group.date)"
                />
              </label>
            </div>
            <ul class="space-y-1.5">
              <li
                v-for="milestone in group.milestones"
                :key="milestone.id"
                class="flex items-center justify-between gap-2 text-sm"
                :data-milestone="milestone.id"
              >
                <span :class="milestone.completed && 'text-muted-foreground line-through'">
                  {{ milestone.title }}
                </span>
                <span v-if="milestone.completed" class="text-xs text-muted-foreground">
                  {{ t('detail.overview.hideCompleted') }}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </Card>

      <Card
        :title="t('detail.overview.attachments')"
        :description="t('detail.overview.attachmentsDescription')"
      >
        <div class="space-y-3">
          <ul v-if="props.detail.attachments.length > 0" class="space-y-2" data-attachments>
            <li
              v-for="file in props.detail.attachments"
              :key="file.id"
              class="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm"
              :data-attachment="file.id"
            >
              <Paperclip class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span class="min-w-0 flex-1 truncate">{{ file.name }}</span>
              <span class="text-xs text-muted-foreground">{{ fileSize(file.size) }}</span>
              <Button
                v-if="canManage"
                variant="ghost"
                size="icon-sm"
                :aria-label="t('detail.overview.removeAttachment', { name: file.name })"
                :data-detach="file.id"
                @click="detachMutation.mutate(file.id)"
              >
                <X class="size-4" aria-hidden="true" />
              </Button>
            </li>
          </ul>
          <p v-else class="text-sm text-muted-foreground">
            {{ t('detail.overview.noAttachments') }}
          </p>

          <Dropzone
            v-if="canManage"
            :label="t('detail.overview.uploadLabel')"
            :hint="t('detail.overview.uploadHint')"
            :browse-label="t('detail.overview.uploadBrowse')"
            :disabled="uploading"
            :error="uploadError || undefined"
            @file="onFile"
          />
          <div v-if="uploading" class="flex items-center gap-2 text-xs text-muted-foreground">
            <UploadCloud class="size-4 animate-pulse" aria-hidden="true" />
            {{ t('detail.overview.uploaded') }}
          </div>
        </div>
      </Card>
    </div>

    <Card :title="t('detail.overview.summary')">
      <div v-if="activity.isPending.value" class="space-y-3">
        <Skeleton v-for="index in 3" :key="index" class="h-12 w-full" />
      </div>
      <Timeline v-else :items="timeline" :empty-label="t('detail.overview.activityEmpty')" />
      <Separator class="my-3" />
      <p class="text-xs text-muted-foreground">{{ t('detail.overview.description') }}</p>
      <p class="pt-1 text-sm">
        {{ project.description || t('detail.overview.noDescription') }}
      </p>
    </Card>
  </div>
</template>
