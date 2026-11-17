<script setup lang="ts">
import type { Department } from '@fish-admin/contracts'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  ErrorState,
  Input,
  Label,
} from '@fish-admin/vue'
import { Pencil, Plus } from 'lucide-vue-next'
import { computed, onBeforeUnmount, ref } from 'vue'

import ListPageHeader from '../../components/common/ListPageHeader.vue'
import { ApiError } from '../../lib/api-error'
import { formatDate } from '../../lib/format'
import { language, useT } from '../../lib/i18n'
import { hasPermission } from '../../lib/permissions'
import { useAuthStore } from '../../stores/auth'
import { createDepartment, updateDepartment } from './api'
import DepartmentTree from './DepartmentTree.vue'
import { departmentsQueryOptions } from './queries'

type FormMode = 'create-root' | 'create-child' | 'rename'

const t = useT('departments')
const commonT = useT('common')
const validationT = useT('validation')

// Mirrors `validateName` in the mock handler (2–40 characters) so an invalid
// value never reaches the API and gets a field-specific message.
const MIN_NAME_LENGTH = 2
const MAX_NAME_LENGTH = 40
const queryClient = useQueryClient()
const auth = useAuthStore()
const query = useQuery(departmentsQueryOptions)

const items = computed<Department[]>(() => query.data.value?.items ?? [])
const selectedId = ref<string | null>(null)
const selected = computed(
  () => items.value.find((item) => item.id === selectedId.value) ?? items.value[0] ?? null,
)
const parentName = computed(
  () => items.value.find((item) => item.id === selected.value?.parentId)?.name ?? t('root'),
)
const canManage = computed(() => hasPermission(auth.user?.permissions ?? [], 'department:manage'))

const feedback = ref<string | null>(null)
let feedbackTimer: ReturnType<typeof setTimeout> | undefined

function showFeedback(message: string) {
  feedback.value = message
  if (feedbackTimer) clearTimeout(feedbackTimer)
  feedbackTimer = setTimeout(() => {
    feedback.value = null
  }, 3000)
}

onBeforeUnmount(() => {
  if (feedbackTimer) clearTimeout(feedbackTimer)
})

const formOpen = ref(false)
const formMode = ref<FormMode>('create-root')
const formName = ref('')
const formError = ref<string | null>(null)
const saving = ref(false)

const isFormNameValid = computed(() => {
  const length = formName.value.trim().length
  return length >= MIN_NAME_LENGTH && length <= MAX_NAME_LENGTH
})

function validateNameLocally(name: string): string | null {
  if (name.length < MIN_NAME_LENGTH) {
    return validationT('minLength', { field: t('form.name'), min: MIN_NAME_LENGTH })
  }
  if (name.length > MAX_NAME_LENGTH) {
    return validationT('maxLength', { field: t('form.name'), max: MAX_NAME_LENGTH })
  }
  return null
}

const formTitle = computed(() => {
  if (formMode.value === 'rename') return t('form.renameTitle')
  if (formMode.value === 'create-child') return t('form.createChildTitle')
  return t('form.createTitle')
})
const formDescription = computed(() => {
  if (formMode.value === 'rename') return t('form.renameDescription')
  if (formMode.value === 'create-child') {
    return t('form.createChildDescription', { parent: selected.value?.name ?? '' })
  }
  return t('form.createRootDescription')
})

function openForm(mode: FormMode) {
  formMode.value = mode
  formName.value = mode === 'rename' ? (selected.value?.name ?? '') : ''
  formError.value = null
  feedback.value = null
  formOpen.value = true
}

async function submitForm() {
  if (saving.value) return
  const name = formName.value.trim()
  const localError = validateNameLocally(name)
  if (localError) {
    formError.value = localError
    return
  }

  saving.value = true
  formError.value = null
  try {
    if (formMode.value === 'rename' && selected.value) {
      await updateDepartment(selected.value.id, { name })
      showFeedback(t('updateSuccess'))
    } else {
      const parentId =
        formMode.value === 'create-child' && selected.value ? selected.value.id : null
      await createDepartment({ name, parentId })
      showFeedback(t('createSuccess'))
    }
    await queryClient.invalidateQueries({ queryKey: ['departments'] })
    formOpen.value = false
  } catch (cause) {
    if (cause instanceof ApiError && cause.code === 'DEPARTMENT_NAME_TAKEN') {
      formError.value = t('nameTaken')
    } else if (cause instanceof ApiError && cause.code === 'INVALID_PARENT') {
      formError.value = t('invalidParent')
    } else if (cause instanceof ApiError && cause.code === 'VALIDATION_ERROR') {
      formError.value = validationT('fixErrors')
    } else {
      formError.value = commonT('states.error.description')
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <ListPageHeader :title="t('title')" :description="t('subtitle')">
      <template v-if="canManage" #actions>
        <Button @click="openForm('create-root')">
          <Plus class="size-4" aria-hidden="true" />
          {{ t('newDepartment') }}
        </Button>
      </template>
    </ListPageHeader>

    <p v-if="feedback" role="status" class="text-sm text-success">{{ feedback }}</p>
    <p v-if="!canManage" class="text-sm text-muted-foreground">{{ t('readOnly') }}</p>

    <ErrorState
      v-if="query.isError.value && !items.length"
      :title="t('loadError')"
      :on-retry="() => query.refetch()"
    />
    <div v-else class="grid gap-4 lg:grid-cols-[minmax(16rem,20rem)_1fr]">
      <section aria-labelledby="department-tree-heading" class="rounded-2xl border p-3">
        <h2 id="department-tree-heading" class="sr-only">{{ t('treeLabel') }}</h2>
        <DepartmentTree
          :items="items"
          :model-value="selected?.id ?? null"
          :label="t('treeLabel')"
          :empty-label="t('treeEmpty')"
          @update:model-value="selectedId = $event"
        />
      </section>

      <section aria-labelledby="department-detail-heading" class="rounded-2xl border p-5">
        <h2 id="department-detail-heading" class="text-lg font-semibold">
          {{ selected?.name ?? t('noSelection') }}
        </h2>
        <template v-if="selected">
          <dl class="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <dt class="text-xs text-muted-foreground">{{ t('parent') }}</dt>
              <dd class="text-sm">{{ parentName }}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">{{ t('manager') }}</dt>
              <dd class="text-sm">{{ selected.managerName ?? t('unassigned') }}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">{{ t('directMembers') }}</dt>
              <dd class="text-sm tabular-nums">{{ selected.directMemberCount }}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">{{ t('totalMembers') }}</dt>
              <dd class="text-sm tabular-nums">{{ selected.memberCount }}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">{{ t('createdAt') }}</dt>
              <dd class="text-sm">{{ formatDate(selected.createdAt, language) }}</dd>
            </div>
          </dl>
          <div v-if="canManage" class="mt-5 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" @click="openForm('create-child')">
              {{ t('newChild') }}
            </Button>
            <Button variant="outline" size="sm" @click="openForm('rename')">
              <Pencil class="size-3.5" aria-hidden="true" />
              {{ t('rename') }}
            </Button>
          </div>
        </template>
      </section>
    </div>

    <Dialog :open="formOpen" @update:open="!$event && (formOpen = false)">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ formTitle }}</DialogTitle>
          <DialogDescription>{{ formDescription }}</DialogDescription>
        </DialogHeader>
        <form class="space-y-4" @submit.prevent="submitForm">
          <div class="space-y-2">
            <Label for="department-name">{{ t('form.name') }}</Label>
            <Input
              id="department-name"
              :model-value="formName"
              :placeholder="t('form.namePlaceholder')"
              @update:model-value="formName = $event"
            />
          </div>
          <p v-if="formError" role="alert" class="text-sm text-destructive">{{ formError }}</p>
          <div class="flex justify-end gap-2">
            <Button type="button" variant="outline" :disabled="saving" @click="formOpen = false">
              {{ commonT('actions.cancel') }}
            </Button>
            <Button type="submit" :disabled="saving || !isFormNameValid">
              {{ formMode === 'rename' ? t('form.save') : t('form.create') }}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
