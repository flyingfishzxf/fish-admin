<script setup lang="ts">
import type { ProjectInput, ProjectPriority, ProjectStatus } from '@fish-admin/contracts'
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'

import { ApiError } from '../../lib/api-error'
import { useT } from '../../lib/i18n'
import { useAuthStore } from '../../stores/auth'
import { createProject } from './api'
import { projectDepartmentsQueryOptions, projectUserOptionsQueryOptions } from './queries'
import { PROJECT_PRIORITIES, PROJECT_STATUSES } from './search'
import { flattenDepartments } from './utils'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  created: [name: string]
}>()

const t = useT('projects')
const auth = useAuthStore()
const queryClient = useQueryClient()

const users = useQuery(projectUserOptionsQueryOptions)
const departments = useQuery(projectDepartmentsQueryOptions)

const step = ref(0)
const name = ref('')
const key = ref('')
const description = ref('')
const status = ref<ProjectStatus>('planning')
const priority = ref<ProjectPriority>('medium')
const ownerId = ref('')
const departmentId = ref('')
const startDate = ref(new Date().toISOString().slice(0, 10))
const dueDate = ref(new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10))
const budget = ref('0')
const error = ref('')

const steps = computed(() => [
  { title: t('create.stepBasics'), description: t('create.stepBasicsDescription') },
  { title: t('create.stepSchedule'), description: t('create.stepScheduleDescription') },
])

const ownerOptions = computed(() => users.data.value ?? [])
const departmentOptions = computed(() => flattenDepartments(departments.data.value ?? []))

function reset() {
  step.value = 0
  name.value = ''
  key.value = ''
  description.value = ''
  status.value = 'planning'
  priority.value = 'medium'
  ownerId.value = auth.user?.id ?? ''
  departmentId.value = ''
  startDate.value = new Date().toISOString().slice(0, 10)
  dueDate.value = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10)
  budget.value = '0'
  error.value = ''
}

watch(
  () => props.open,
  (open) => {
    if (open) reset()
  },
  { immediate: true },
)

function validateBasics() {
  if (name.value.trim().length < 2) return t('validation.required', { label: t('fields.name') })
  if (!/^[A-Za-z]{2,6}$/.test(key.value.trim())) return t('fields.keyHint')
  return ''
}

function validateSchedule() {
  if (!ownerId.value) return t('validation.required', { label: t('fields.owner') })
  if (dueDate.value < startDate.value) return t('validation.dateOrder')
  const amount = Number(budget.value)
  if (!Number.isFinite(amount) || amount < 0) {
    return t('validation.min', { label: t('fields.budget'), limit: 0 })
  }
  return ''
}

function next() {
  const message = validateBasics()
  error.value = message
  if (!message) step.value = 1
}

const mutation = useMutation({
  mutationFn: (input: ProjectInput) => createProject(input),
  onSuccess: async (project) => {
    await queryClient.invalidateQueries({ queryKey: ['projects'] })
    await queryClient.invalidateQueries({ queryKey: ['audit-events'] })
    emit('created', project.name)
    emit('update:open', false)
  },
  onError: (cause) => {
    error.value =
      cause instanceof ApiError && cause.status === 409
        ? t('validation.keyTaken')
        : t('create.error')
  },
})

function submit() {
  const message = validateBasics() || validateSchedule()
  error.value = message
  if (message) return

  mutation.mutate({
    name: name.value.trim(),
    key: key.value.trim().toUpperCase(),
    description: description.value.trim(),
    status: status.value,
    priority: priority.value,
    ownerId: ownerId.value,
    memberIds: [ownerId.value],
    departmentId: departmentId.value || undefined,
    tags: [],
    budget: Math.round(Number(budget.value) || 0),
    startDate: new Date(`${startDate.value}T00:00:00.000Z`).toISOString(),
    dueDate: new Date(`${dueDate.value}T00:00:00.000Z`).toISOString(),
  })
}
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-lg" data-create-dialog>
      <form class="space-y-4" @submit.prevent>
        <DialogHeader>
          <DialogTitle>{{ t('create.title') }}</DialogTitle>
          <DialogDescription>{{ t('create.description') }}</DialogDescription>
        </DialogHeader>

        <ol class="flex flex-wrap items-center gap-2" :aria-label="t('create.stepsLabel')">
          <li
            v-for="(entry, index) in steps"
            :key="entry.title"
            :aria-current="step === index ? 'step' : undefined"
            class="flex items-center gap-1.5 text-xs"
            :class="step === index ? 'font-medium text-foreground' : 'text-muted-foreground'"
          >
            <span
              class="flex size-5 items-center justify-center rounded-full border text-[10px]"
              :class="step === index && 'border-primary bg-primary text-primary-foreground'"
              aria-hidden="true"
            >
              {{ index + 1 }}
            </span>
            {{ entry.title }}
          </li>
        </ol>

        <template v-if="step === 0">
          <div class="space-y-1.5">
            <Label for="project-name">{{ t('fields.name') }}</Label>
            <Input
              id="project-name"
              v-model="name"
              :placeholder="t('fields.namePlaceholder')"
              :maxlength="60"
              data-field="name"
            />
          </div>

          <div class="space-y-1.5">
            <Label for="project-key">{{ t('fields.key') }}</Label>
            <Input
              id="project-key"
              v-model="key"
              :placeholder="t('fields.keyPlaceholder')"
              :maxlength="6"
              class="uppercase"
              data-field="key"
            />
            <p class="text-xs text-muted-foreground">{{ t('fields.keyHint') }}</p>
          </div>

          <div class="space-y-1.5">
            <Label for="project-description">{{ t('fields.description') }}</Label>
            <textarea
              id="project-description"
              v-model="description"
              rows="3"
              :placeholder="t('fields.descriptionPlaceholder')"
              data-field="description"
              class="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label>{{ t('fields.status') }}</Label>
              <Select v-model="status">
                <SelectTrigger :aria-label="t('fields.status')" data-field="status">
                  <SelectValue :label="t(`status.${status}`)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="option in PROJECT_STATUSES" :key="option" :value="option">
                    {{ t(`status.${option}`) }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-1.5">
              <Label>{{ t('fields.priority') }}</Label>
              <Select v-model="priority">
                <SelectTrigger :aria-label="t('fields.priority')" data-field="priority">
                  <SelectValue :label="t(`priority.${priority}`)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="option in PROJECT_PRIORITIES" :key="option" :value="option">
                    {{ t(`priority.${option}`) }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="space-y-1.5">
            <Label>{{ t('fields.owner') }}</Label>
            <Select v-model="ownerId">
              <SelectTrigger :aria-label="t('fields.owner')" data-field="owner">
                <SelectValue
                  :label="ownerOptions.find((user) => user.id === ownerId)?.name"
                  :placeholder="t('fields.ownerPlaceholder')"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="user in ownerOptions" :key="user.id" :value="user.id">
                  {{ user.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1.5">
            <Label>{{ t('fields.department') }}</Label>
            <Select v-model="departmentId">
              <SelectTrigger :aria-label="t('fields.department')">
                <SelectValue
                  :label="departmentOptions.find((entry) => entry.value === departmentId)?.label"
                  :placeholder="t('fields.departmentPlaceholder')"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="entry in departmentOptions"
                  :key="entry.value"
                  :value="entry.value"
                >
                  {{ entry.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div class="space-y-1.5">
              <Label for="project-start">{{ t('fields.startDate') }}</Label>
              <Input id="project-start" v-model="startDate" type="date" data-field="start" />
            </div>
            <div class="space-y-1.5">
              <Label for="project-due">{{ t('fields.dueDate') }}</Label>
              <Input id="project-due" v-model="dueDate" type="date" data-field="due" />
            </div>
          </div>

          <div class="space-y-1.5">
            <Label for="project-budget">{{ t('fields.budget') }}</Label>
            <Input id="project-budget" v-model="budget" type="number" min="0" step="100" />
          </div>
        </template>

        <p v-if="error" role="alert" class="text-sm text-destructive" data-create-error>
          {{ error }}
        </p>

        <DialogFooter class="flex-wrap gap-2">
          <Button
            v-if="step === 1"
            type="button"
            variant="ghost"
            data-create-back
            @click="step = 0"
          >
            <ArrowLeft class="size-4" aria-hidden="true" />
            {{ t('create.back') }}
          </Button>
          <span v-else class="flex-1" />
          <Button type="button" variant="outline" @click="emit('update:open', false)">
            {{ t('common:actions.cancel') }}
          </Button>
          <Button v-if="step === 0" type="button" data-create-next @click="next">
            {{ t('create.next') }}
            <ArrowRight class="size-4" aria-hidden="true" />
          </Button>
          <Button
            v-else
            type="button"
            :disabled="mutation.isPending.value"
            data-create-submit
            @click="submit"
          >
            <Loader2
              v-if="mutation.isPending.value"
              class="size-4 animate-spin"
              aria-hidden="true"
            />
            {{ t('create.submit') }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
