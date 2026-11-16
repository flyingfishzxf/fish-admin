<script setup lang="ts">
import type { ProjectDetail, ProjectTask, ProjectTaskStatus } from '@fish-admin/contracts'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@fish-admin/vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { CalendarClock, Plus } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'

import ProgressBar from '../../components/ui/ProgressBar.vue'
import { formatDate } from '../../lib/format'
import { language, useT } from '../../lib/i18n'
import { createProjectTask, updateProjectTask } from './api'
import { groupTasks, TASK_STATUSES, taskCompletion } from './utils'

const props = defineProps<{ detail: ProjectDetail; canManage: boolean }>()

const t = useT('projects')
const queryClient = useQueryClient()

const project = computed(() => props.detail.project)
const groups = computed(() => groupTasks(props.detail.tasks))
const completion = computed(() => taskCompletion(props.detail.tasks))

const addOpen = ref(false)
const title = ref('')
const assigneeId = ref('')
const status = ref<ProjectTaskStatus>('todo')
const dueDate = ref('')
const error = ref('')

const memberOptions = computed(() =>
  project.value.memberIds.map((id, index) => ({
    value: id,
    label: project.value.memberNames[index] ?? id,
  })),
)

function resetForm() {
  title.value = ''
  assigneeId.value = ''
  status.value = 'todo'
  dueDate.value = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10)
  error.value = ''
}

watch(
  () => addOpen.value,
  (open) => {
    if (open) resetForm()
  },
)

function invalidate() {
  return queryClient.invalidateQueries({ queryKey: ['projects'] })
}

const createMutation = useMutation({
  mutationFn: () =>
    createProjectTask(project.value.id, {
      title: title.value.trim(),
      status: status.value,
      assigneeId: assigneeId.value || undefined,
      dueDate: dueDate.value ? new Date(`${dueDate.value}T00:00:00.000Z`).toISOString() : undefined,
    }),
  onSuccess: async () => {
    await invalidate()
    await queryClient.invalidateQueries({ queryKey: ['audit-events'] })
    addOpen.value = false
  },
  onError: (cause) => {
    error.value =
      cause instanceof Error && cause.message ? cause.message : t('detail.tasks.createFailed')
  },
})

const statusMutation = useMutation({
  mutationFn: ({ task, next }: { task: ProjectTask; next: ProjectTaskStatus }) =>
    updateProjectTask(project.value.id, task.id, { status: next }),
  onSuccess: () => {
    void invalidate()
  },
})

function submit() {
  if (title.value.trim().length < 2) {
    error.value = t('validation.required', { label: t('detail.tasks.taskTitle') })
    return
  }
  createMutation.mutate()
}

function setStatus(task: ProjectTask, value: string) {
  statusMutation.mutate({ task, next: value as ProjectTaskStatus })
}

function assigneeName(task: ProjectTask) {
  const index = task.assigneeId ? project.value.memberIds.indexOf(task.assigneeId) : -1
  return index >= 0 ? project.value.memberNames[index] : task.assigneeName
}
</script>

<template>
  <div class="space-y-4" data-tasks-tab>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="space-y-1">
        <h2 class="text-base font-semibold">{{ t('detail.tasks.title') }}</h2>
        <p class="text-sm text-muted-foreground">{{ t('detail.tasks.description') }}</p>
      </div>
      <Button v-if="canManage" data-add-task @click="addOpen = true">
        <Plus class="size-4" aria-hidden="true" />
        {{ t('detail.tasks.add') }}
      </Button>
    </div>

    <p
      v-if="props.detail.tasks.length === 0"
      class="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground"
      data-tasks-empty
    >
      {{ t('detail.tasks.empty') }}
    </p>

    <template v-else>
      <div class="space-y-1.5 rounded-xl border p-4">
        <div class="flex items-center justify-between text-xs text-muted-foreground">
          <span>{{ t('card.tasks', { done: completion.done, total: completion.total }) }}</span>
          <span>{{ completion.percent }}%</span>
        </div>
        <ProgressBar
          :value="completion.percent"
          :ariaLabel="t('detail.overview.progress')"
          data-task-progress
        />
      </div>

      <div class="space-y-4">
        <section
          v-for="group in groups"
          :key="group.status"
          class="rounded-xl border"
          :data-task-group="group.status"
        >
          <header class="border-b px-4 py-2 text-sm font-medium">
            <!-- The label already carries the count; a second number on the right
                 just gave the eye two places to read the same thing. -->
            {{
              t('detail.tasks.group', {
                status: t(`detail.tasks.statuses.${group.status}`),
                count: group.tasks.length,
              })
            }}
          </header>
          <p v-if="group.tasks.length === 0" class="px-4 py-3 text-sm text-muted-foreground">
            {{ t('detail.tasks.empty') }}
          </p>
          <ul v-else class="divide-y">
            <li
              v-for="task in group.tasks"
              :key="task.id"
              class="flex flex-wrap items-center gap-3 px-4 py-2"
              :data-task="task.id"
            >
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium">{{ task.title }}</p>
                <p class="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{{ assigneeName(task) ?? t('detail.tasks.unassigned') }}</span>
                  <span class="inline-flex items-center gap-1">
                    <CalendarClock class="size-3.5" aria-hidden="true" />
                    {{ formatDate(task.dueDate, language, { month: 'short', day: 'numeric' }) }}
                  </span>
                </p>
              </div>
              <Select
                :model-value="task.status"
                :disabled="!canManage || statusMutation.isPending.value"
                @update:modelValue="setStatus(task, String($event))"
              >
                <SelectTrigger
                  class="h-8 w-[8.5rem]"
                  :aria-label="t('detail.tasks.status')"
                  :data-task-status="task.id"
                >
                  <SelectValue :label="t(`detail.tasks.statuses.${task.status}`)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="option in TASK_STATUSES" :key="option" :value="option">
                    {{ t(`detail.tasks.statuses.${option}`) }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </li>
          </ul>
        </section>
      </div>
    </template>

    <Dialog :open="addOpen" @update:open="addOpen = $event">
      <DialogContent data-add-task-dialog>
        <form class="space-y-4" @submit.prevent="submit">
          <DialogHeader>
            <DialogTitle>{{ t('detail.tasks.addTitle') }}</DialogTitle>
            <DialogDescription>{{ t('detail.tasks.addDescription') }}</DialogDescription>
          </DialogHeader>

          <div class="space-y-1.5">
            <Label for="task-title">{{ t('detail.tasks.taskTitle') }}</Label>
            <Input
              id="task-title"
              v-model="title"
              :placeholder="t('detail.tasks.titlePlaceholder')"
              data-field="task-title"
            />
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label>{{ t('detail.tasks.assignee') }}</Label>
              <Select v-model="assigneeId">
                <SelectTrigger :aria-label="t('detail.tasks.assignee')">
                  <SelectValue
                    :label="memberOptions.find((option) => option.value === assigneeId)?.label"
                    :placeholder="t('detail.tasks.unassigned')"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="option in memberOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-1.5">
              <Label>{{ t('detail.tasks.status') }}</Label>
              <Select v-model="status">
                <SelectTrigger :aria-label="t('detail.tasks.status')">
                  <SelectValue :label="t(`detail.tasks.statuses.${status}`)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="option in TASK_STATUSES" :key="option" :value="option">
                    {{ t(`detail.tasks.statuses.${option}`) }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="space-y-1.5">
            <Label for="task-due">{{ t('detail.overview.dueDate') }}</Label>
            <Input id="task-due" v-model="dueDate" type="date" data-field="task-due" />
          </div>

          <p v-if="error" role="alert" class="text-sm text-destructive" data-task-error>
            {{ error }}
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" @click="addOpen = false">
              {{ t('common:actions.cancel') }}
            </Button>
            <Button type="submit" :disabled="createMutation.isPending.value" data-submit-task>
              {{ t('detail.tasks.create') }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
