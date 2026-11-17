<script setup lang="ts">
import type { DictionaryItem, DictionaryType } from '@fish-admin/contracts'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  EmptyState,
  ErrorState,
  Input,
  Label,
  Skeleton,
  Switch,
} from '@fish-admin/vue'
import { BookMarked, GripVertical, Pencil, Plus, Trash2 } from 'lucide-vue-next'
import { computed, onBeforeUnmount, ref } from 'vue'

import ListPageHeader from '../../components/common/ListPageHeader.vue'
import { ApiError } from '../../lib/api-error'
import { useT } from '../../lib/i18n'
import { hasPermission } from '../../lib/permissions'
import { useAuthStore } from '../../stores/auth'
import {
  createDictionary,
  createDictionaryItem,
  deleteDictionary,
  deleteDictionaryItem,
  reorderDictionaryItems,
  updateDictionary,
  updateDictionaryItem,
} from './api'
import { dictionaryKeys, dictionaryDetailQueryOptions, dictionaryListQueryOptions } from './queries'

type DialogMode =
  'type-create' | 'type-edit' | 'type-delete' | 'item-create' | 'item-edit' | 'item-delete'

// Mirrors the mock validators so an invalid value never reaches the API and
// gets a message the user can act on.
const CODE_PATTERN = /^[a-z][a-z0-9_]{1,31}$/
const VALUE_PATTERN = /^[a-z0-9][a-z0-9_-]{0,31}$/
const MIN_NAME_LENGTH = 2
const MAX_NAME_LENGTH = 48
const MAX_LABEL_LENGTH = 40
const MAX_DESCRIPTION_LENGTH = 200

// Seeded types ship with an English name in the mock database; the copy for
// them lives in the bundle so a zh-CN screen does not mix languages.
const SEEDED_TYPE_CODES = new Set(['user_tag', 'expense_category', 'approval_priority'])

const t = useT('dictionaries')
const commonT = useT('common')
const validationT = useT('validation')

const queryClient = useQueryClient()
const auth = useAuthStore()
const list = useQuery(dictionaryListQueryOptions)

const types = computed<DictionaryType[]>(() => list.data.value ?? [])
const selectedId = ref<string | null>(null)

// React syncs the selection in an effect. Deriving it instead keeps the page
// converged in the same tick: deleting the selected type, or a refetch that no
// longer contains it, falls back to the first type.
const selected = computed<DictionaryType | null>(() => {
  const all = types.value
  if (!all.length) return null
  return all.find((entry) => entry.id === selectedId.value) ?? all[0] ?? null
})

const detail = useQuery(computed(() => dictionaryDetailQueryOptions(selected.value?.id ?? '')))
const items = computed<DictionaryItem[]>(() => detail.data.value?.items ?? [])
const dictionary = computed(() => detail.data.value?.dictionary ?? null)

const canManage = computed(() => hasPermission(auth.user?.permissions ?? [], 'dictionary:manage'))
const deleteTypeBlocked = computed(
  () => (selected.value?.itemCount ?? 0) > 0 || Boolean(selected.value?.isSystem),
)

const feedback = ref<string | null>(null)
const feedbackError = ref<string | null>(null)
let feedbackTimer: ReturnType<typeof setTimeout> | undefined

function showFeedback(message: string) {
  feedback.value = message
  feedbackError.value = null
  if (feedbackTimer) clearTimeout(feedbackTimer)
  feedbackTimer = setTimeout(() => {
    feedback.value = null
  }, 3000)
}

function showFeedbackError(message: string) {
  feedbackError.value = message
  feedback.value = null
}

onBeforeUnmount(() => {
  if (feedbackTimer) clearTimeout(feedbackTimer)
})

function typeName(type: DictionaryType) {
  return SEEDED_TYPE_CODES.has(type.code)
    ? t(`seedTypes.${type.code}.name`, { defaultValue: type.name })
    : type.name
}

function typeDescription(type: DictionaryType) {
  return SEEDED_TYPE_CODES.has(type.code)
    ? t(`seedTypes.${type.code}.description`, { defaultValue: type.description })
    : type.description
}

function typeUsage(type: DictionaryType) {
  return t(`usage.${type.code}`, { defaultValue: t('usage.none') })
}

function errorMessage(cause: unknown): string {
  const code = cause instanceof ApiError ? cause.code : ''
  if (code === 'DICTIONARY_CODE_TAKEN') return t('errors.codeTaken')
  if (code === 'ITEM_LABEL_TAKEN') return t('errors.labelTaken')
  if (code === 'ITEM_VALUE_TAKEN') return t('errors.valueTaken')
  if (code === 'ITEM_IN_USE') return t('errors.inUse')
  if (code === 'DICTIONARY_PROTECTED' || code === 'ITEM_PROTECTED') return t('errors.protected')
  if (code === 'DICTIONARY_NOT_EMPTY') return t('errors.notEmpty')
  if (code === 'DICTIONARY_NOT_FOUND' || code === 'ITEM_NOT_FOUND') return t('errors.notFound')
  return t('errors.unknown')
}

/* ---------------------------------------------------------------- dialogs */

const dialogMode = ref<DialogMode | null>(null)
const activeItem = ref<DictionaryItem | null>(null)
const formCode = ref('')
const formName = ref('')
const formLabel = ref('')
const formValue = ref('')
const formDescription = ref('')
const formError = ref<string | null>(null)
const saving = ref(false)

const isTypeDialog = computed(() => dialogMode.value?.startsWith('type') ?? false)
const isDeleteDialog = computed(() => dialogMode.value?.endsWith('delete') ?? false)
const typeLocked = computed(() => Boolean(selected.value?.isSystem))
const valueLocked = computed(() => (activeItem.value?.referenceCount ?? 0) > 0)

const isCodeValid = computed(() => CODE_PATTERN.test(formCode.value.trim()))
const isNameValid = computed(() => {
  const length = formName.value.trim().length
  return length >= MIN_NAME_LENGTH && length <= MAX_NAME_LENGTH
})
const isLabelValid = computed(() => {
  const length = formLabel.value.trim().length
  return length >= 1 && length <= MAX_LABEL_LENGTH
})
const isValueValid = computed(() => valueLocked.value || VALUE_PATTERN.test(formValue.value.trim()))

const isSubmitDisabled = computed(() => {
  if (saving.value) return true
  if (isDeleteDialog.value) return false
  if (isTypeDialog.value) {
    if (!isNameValid.value) return true
    return dialogMode.value === 'type-create' && !isCodeValid.value
  }
  if (!isLabelValid.value) return true
  return !isValueValid.value
})

function resetForm() {
  formCode.value = ''
  formName.value = ''
  formLabel.value = ''
  formValue.value = ''
  formDescription.value = ''
  formError.value = null
}

function openTypeDialog(mode: 'type-create' | 'type-edit' | 'type-delete') {
  resetForm()
  dialogMode.value = mode
  activeItem.value = null
  const type = selected.value
  if (type && mode !== 'type-create') {
    formCode.value = type.code
    formName.value = type.name
    formDescription.value = type.description
  }
  feedback.value = null
  feedbackError.value = null
}

function openItemDialog(mode: 'item-create' | 'item-edit' | 'item-delete', item?: DictionaryItem) {
  resetForm()
  dialogMode.value = mode
  activeItem.value = item ?? null
  if (item) {
    formLabel.value = item.label
    formValue.value = item.value
    formDescription.value = item.description
  }
  feedback.value = null
  feedbackError.value = null
}

function closeDialog() {
  dialogMode.value = null
  activeItem.value = null
}

const dialogTitle = computed(() => {
  const type = selected.value
  switch (dialogMode.value) {
    case 'type-create':
      return t('type.createTitle')
    case 'type-edit':
      return t('type.editTitle')
    case 'type-delete':
      return t('type.deleteTitle', { name: type ? typeName(type) : '' })
    case 'item-create':
      return t('item.createTitle')
    case 'item-edit':
      return t('item.editTitle')
    case 'item-delete':
      return t('item.deleteTitle', { label: activeItem.value?.label ?? '' })
    default:
      return ''
  }
})

const dialogDescription = computed(() => {
  const item = activeItem.value
  switch (dialogMode.value) {
    case 'type-delete':
      return deleteTypeBlocked.value && (selected.value?.itemCount ?? 0) > 0
        ? t('errors.notEmpty')
        : t('type.deleteDescription')
    case 'item-edit':
      return valueLocked.value ? t('item.valueLocked') : t('type.codeHint')
    case 'item-delete':
      if (item?.isSystem) return t('item.deleteBlocked')
      if ((item?.referenceCount ?? 0) > 0) {
        return t('item.inUse', { count: item?.referenceCount ?? 0 })
      }
      return t('item.deleteDescription')
    default:
      return t('type.codeHint')
  }
})

const submitLabel = computed(() => {
  if (isDeleteDialog.value) return commonT('actions.delete')
  if (dialogMode.value === 'type-create') return t('newType')
  if (dialogMode.value === 'item-create') return t('item.new')
  return commonT('actions.save')
})

async function invalidate() {
  await queryClient.invalidateQueries({ queryKey: dictionaryKeys.all })
}

async function submitDialog() {
  const mode = dialogMode.value
  const type = selected.value
  if (saving.value || !mode) return
  // Creating a type is the one action that must work with an empty rail.
  if (!type && mode !== 'type-create') return

  if (mode === 'type-create' && !isCodeValid.value) {
    formError.value = t('errors.invalidCode')
    return
  }
  if (!isDeleteDialog.value && isTypeDialog.value && !isNameValid.value) {
    formError.value = validationT('minLength', {
      field: t('type.name'),
      min: MIN_NAME_LENGTH,
    })
    return
  }
  if (mode === 'item-create' || mode === 'item-edit') {
    if (!isLabelValid.value) {
      formError.value = validationT('maxLength', {
        field: t('item.label'),
        max: MAX_LABEL_LENGTH,
      })
      return
    }
    if (!isValueValid.value) {
      formError.value = t('errors.invalidValue')
      return
    }
  }

  saving.value = true
  formError.value = null
  const typeId = type?.id ?? ''
  try {
    if (mode === 'type-create') {
      const created = await createDictionary({
        code: formCode.value.trim(),
        name: formName.value.trim(),
        description: formDescription.value.trim(),
      })
      showFeedback(t('type.created'))
      // Select the new type so the right pane shows what was just created.
      selectedId.value = created.dictionary.id
    } else if (mode === 'type-edit') {
      await updateDictionary(typeId, {
        name: formName.value.trim(),
        description: formDescription.value.trim(),
      })
      showFeedback(t('type.updated'))
    } else if (mode === 'type-delete') {
      await deleteDictionary(typeId)
      showFeedback(t('type.deleted'))
      selectedId.value = null
    } else if (!activeItem.value && mode === 'item-create') {
      await createDictionaryItem(typeId, {
        label: formLabel.value.trim(),
        value: formValue.value.trim(),
        description: formDescription.value.trim(),
      })
      showFeedback(t('item.created'))
    } else if (activeItem.value && mode === 'item-edit') {
      await updateDictionaryItem(typeId, activeItem.value.id, {
        label: formLabel.value.trim(),
        // A referenced value cannot change; sending it would 409.
        ...(valueLocked.value ? {} : { value: formValue.value.trim() }),
        description: formDescription.value.trim(),
      })
      showFeedback(t('item.updated'))
    } else if (activeItem.value && mode === 'item-delete') {
      await deleteDictionaryItem(typeId, activeItem.value.id)
      showFeedback(t('item.deleted'))
    }
    await invalidate()
    closeDialog()
  } catch (cause) {
    formError.value = errorMessage(cause)
  } finally {
    saving.value = false
  }
}

/* ------------------------------------------------------------- item table */

const pendingItemId = ref<string | null>(null)
const handleRefs = new Map<string, HTMLButtonElement>()

function setHandle(id: string, element: unknown) {
  if (element instanceof HTMLButtonElement) handleRefs.set(id, element)
  else handleRefs.delete(id)
}

async function toggleItem(item: DictionaryItem, enabled: boolean) {
  const type = selected.value
  if (!type || pendingItemId.value) return
  pendingItemId.value = item.id
  try {
    await updateDictionaryItem(type.id, item.id, { enabled })
    showFeedback(enabled ? t('item.enabledToast') : t('item.disabledToast'))
    await invalidate()
  } catch (cause) {
    showFeedbackError(errorMessage(cause))
  } finally {
    pendingItemId.value = null
  }
}

async function moveItem(sourceId: string, targetId: string) {
  const type = selected.value
  if (!type || pendingItemId.value) return
  const order = items.value.map((item) => item.id)
  const from = order.indexOf(sourceId)
  const to = order.indexOf(targetId)
  if (from === -1 || to === -1 || from === to) return
  const next = [...order]
  next.splice(from, 1)
  next.splice(to, 0, sourceId)

  pendingItemId.value = sourceId
  try {
    await reorderDictionaryItems(type.id, next)
    showFeedback(t('item.moved'))
    await invalidate()
  } catch (cause) {
    showFeedbackError(errorMessage(cause))
  } finally {
    pendingItemId.value = null
    // The grip keeps its identity across the refetch, so focusing it here
    // survives the re-render and the keyboard user does not lose their place.
    handleRefs.get(sourceId)?.focus()
  }
}

const draggingId = ref<string | null>(null)

function onRowDrop(targetId: string) {
  const sourceId = draggingId.value
  draggingId.value = null
  if (sourceId && sourceId !== targetId) void moveItem(sourceId, targetId)
}

function onHandleKeydown(event: KeyboardEvent, item: DictionaryItem, index: number) {
  if (!canManage.value) return
  if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
  event.preventDefault()
  const target = items.value[index + (event.key === 'ArrowUp' ? -1 : 1)]
  if (target) void moveItem(item.id, target.id)
}
</script>

<template>
  <div class="space-y-6">
    <ListPageHeader :title="t('title')" :description="t('description')">
      <template v-if="canManage" #actions>
        <Button @click="openTypeDialog('type-create')">
          <Plus class="size-4" aria-hidden="true" />
          {{ t('newType') }}
        </Button>
      </template>
    </ListPageHeader>

    <p v-if="feedback" role="status" class="text-sm text-success">{{ feedback }}</p>
    <p v-if="feedbackError" role="alert" class="text-sm text-destructive">{{ feedbackError }}</p>

    <ErrorState
      v-if="list.isError.value && !types.length"
      :on-retry="() => list.refetch()"
      class="py-8"
    />
    <div v-else class="grid items-start gap-4 lg:grid-cols-[minmax(16rem,18rem)_1fr]">
      <section aria-labelledby="dictionary-types-heading" class="rounded-2xl border p-3">
        <h2 id="dictionary-types-heading" class="px-2 text-sm font-semibold">
          {{ t('typesTitle') }}
        </h2>
        <p class="px-2 text-xs text-muted-foreground">
          {{ t('typeCount', { count: types.length }) }}
        </p>
        <div v-if="list.isPending.value" class="mt-2 space-y-2">
          <Skeleton v-for="index in 3" :key="index" class="h-12 w-full" />
        </div>
        <ul v-else class="mt-2 space-y-1" :aria-label="t('typesTitle')">
          <li v-for="type in types" :key="type.id">
            <button
              type="button"
              :aria-pressed="type.id === selected?.id"
              :data-type-id="type.id"
              class="flex w-full flex-col gap-1 rounded-md px-2 py-2 text-start outline-none hover:bg-accent"
              :class="type.id === selected?.id && 'bg-accent'"
              @click="selectedId = type.id"
            >
              <span class="flex items-center justify-between gap-2">
                <span class="truncate text-sm font-medium">{{ typeName(type) }}</span>
                <Badge :variant="type.id === selected?.id ? 'default' : 'secondary'">
                  {{ type.itemCount }}
                </Badge>
              </span>
              <span class="flex items-center gap-2">
                <code class="truncate text-xs text-muted-foreground">{{ type.code }}</code>
                <span v-if="type.referenceCount > 0" class="shrink-0 text-xs text-muted-foreground">
                  {{ t('type.references', { count: type.referenceCount }) }}
                </span>
              </span>
            </button>
          </li>
        </ul>
      </section>

      <section aria-labelledby="dictionary-detail-heading" class="rounded-2xl border p-5">
        <EmptyState
          v-if="!selected"
          :icon="BookMarked"
          :title="t('empty.title')"
          :description="t('empty.description')"
        />
        <div v-else-if="detail.isPending.value" class="space-y-3">
          <Skeleton class="h-6 w-48" />
          <Skeleton class="h-4 w-72" />
          <Skeleton class="h-40 w-full" />
        </div>
        <ErrorState
          v-else-if="detail.isError.value || !dictionary"
          :on-retry="() => detail.refetch()"
          class="border-0"
        />
        <template v-else>
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="space-y-1">
              <h2
                id="dictionary-detail-heading"
                class="flex flex-wrap items-center gap-2 text-lg font-semibold"
              >
                {{ typeName(dictionary) }}
                <Badge variant="outline">{{ dictionary.code }}</Badge>
                <Badge variant="secondary">
                  {{ dictionary.isSystem ? t('type.system') : t('type.custom') }}
                </Badge>
              </h2>
              <p class="text-sm text-muted-foreground">{{ typeDescription(dictionary) }}</p>
              <p class="text-xs text-muted-foreground">{{ typeUsage(dictionary) }}</p>
            </div>
            <div v-if="canManage" class="flex flex-wrap items-center gap-2">
              <template v-if="!typeLocked">
                <Button variant="outline" size="sm" @click="openTypeDialog('type-edit')">
                  <Pencil class="size-3.5" aria-hidden="true" />
                  {{ t('type.edit') }}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  class="text-destructive"
                  :disabled="deleteTypeBlocked"
                  :title="deleteTypeBlocked ? t('errors.notEmpty') : undefined"
                  data-action="delete-type"
                  @click="openTypeDialog('type-delete')"
                >
                  <Trash2 class="size-3.5" aria-hidden="true" />
                  {{ t('type.delete') }}
                </Button>
              </template>
              <Button size="sm" data-action="new-item" @click="openItemDialog('item-create')">
                <Plus class="size-4" aria-hidden="true" />
                {{ t('item.new') }}
              </Button>
            </div>
          </div>

          <EmptyState
            v-if="!items.length"
            class="px-0 py-10"
            :title="t('item.empty')"
            :description="t('item.reorderHint')"
          />
          <div v-else class="mt-4 space-y-2">
            <table
              data-slot="dictionary-items"
              class="w-full text-sm"
              :aria-label="t('item.title')"
            >
              <thead class="text-[11px] font-semibold tracking-wide uppercase">
                <tr class="border-b">
                  <th scope="col" class="h-10 w-10 px-2 text-start">
                    <span class="sr-only">{{ t('item.order') }}</span>
                  </th>
                  <th scope="col" class="h-10 px-2 text-start">{{ t('item.label') }}</th>
                  <th scope="col" class="h-10 px-2 text-start">{{ t('item.value') }}</th>
                  <th scope="col" class="hidden h-10 px-2 text-start md:table-cell">
                    {{ t('item.usage') }}
                  </th>
                  <th scope="col" class="h-10 px-2 text-start">{{ t('item.status') }}</th>
                  <th scope="col" class="h-10 w-24 px-2 text-end">
                    <span class="sr-only">{{ commonT('actions.more') }}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, index) in items"
                  :key="item.id"
                  :data-item-id="item.id"
                  class="border-b last:border-0"
                  :class="draggingId === item.id && 'opacity-50'"
                  @dragover.prevent
                  @drop="onRowDrop(item.id)"
                >
                  <td class="p-2 align-middle">
                    <button
                      type="button"
                      :ref="(element) => setHandle(item.id, element)"
                      :draggable="canManage"
                      :disabled="!canManage"
                      :aria-label="t('item.reorder', { label: item.label })"
                      aria-describedby="dictionary-reorder-hint"
                      class="flex size-7 items-center justify-center rounded text-muted-foreground outline-none hover:bg-muted"
                      :class="canManage ? 'cursor-grab disabled:cursor-not-allowed' : ''"
                      @dragstart="draggingId = item.id"
                      @dragend="draggingId = null"
                      @keydown="onHandleKeydown($event, item, index)"
                    >
                      <GripVertical class="size-4" aria-hidden="true" />
                    </button>
                  </td>
                  <td class="p-2 align-middle">
                    <div class="flex items-center gap-2">
                      <span class="font-medium">{{ item.label }}</span>
                      <span
                        v-if="item.description"
                        class="hidden max-w-48 truncate text-xs text-muted-foreground lg:inline"
                      >
                        {{ item.description }}
                      </span>
                    </div>
                  </td>
                  <td class="p-2 align-middle">
                    <code class="rounded bg-muted px-1.5 py-0.5 text-xs">{{ item.value }}</code>
                  </td>
                  <td class="hidden p-2 align-middle md:table-cell">
                    <Badge v-if="item.referenceCount > 0" variant="secondary">
                      {{ t('item.referenceCount', { count: item.referenceCount }) }}
                    </Badge>
                    <span v-else class="text-muted-foreground">—</span>
                  </td>
                  <td class="p-2 align-middle">
                    <Switch
                      size="sm"
                      :model-value="item.enabled"
                      :disabled="!canManage || pendingItemId === item.id"
                      :aria-label="t('item.toggle', { label: item.label })"
                      @update:model-value="toggleItem(item, $event)"
                    />
                  </td>
                  <td class="p-2 align-middle">
                    <div class="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        :disabled="!canManage"
                        :aria-label="t('item.edit')"
                        :data-item-id="item.id"
                        data-action="edit-item"
                        @click="openItemDialog('item-edit', item)"
                      >
                        <Pencil class="size-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        class="text-destructive"
                        :disabled="!canManage || item.isSystem || item.referenceCount > 0"
                        :aria-label="t('item.delete')"
                        :data-item-id="item.id"
                        data-action="delete-item"
                        :title="
                          item.isSystem
                            ? t('item.deleteBlocked')
                            : item.referenceCount > 0
                              ? t('item.inUse', { count: item.referenceCount })
                              : undefined
                        "
                        @click="openItemDialog('item-delete', item)"
                      >
                        <Trash2 class="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <p id="dictionary-reorder-hint" class="text-xs text-muted-foreground">
              {{ t('item.reorderHint') }}
            </p>
          </div>
        </template>
      </section>
    </div>

    <Dialog :open="dialogMode !== null" @update:open="!$event && closeDialog()">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ dialogTitle }}</DialogTitle>
          <DialogDescription>{{ dialogDescription }}</DialogDescription>
        </DialogHeader>
        <form class="space-y-4" @submit.prevent="submitDialog">
          <template v-if="!isDeleteDialog">
            <div v-if="isTypeDialog" class="space-y-2">
              <Label for="dictionary-code">{{ t('type.code') }}</Label>
              <Input
                id="dictionary-code"
                :model-value="formCode"
                :disabled="dialogMode !== 'type-create'"
                placeholder="expense_category"
                @update:model-value="formCode = $event"
              />
            </div>
            <div v-if="isTypeDialog" class="space-y-2">
              <Label for="dictionary-name">{{ t('type.name') }}</Label>
              <Input
                id="dictionary-name"
                :model-value="formName"
                :placeholder="t('type.name')"
                @update:model-value="formName = $event"
              />
            </div>
            <template v-else>
              <div class="space-y-2">
                <Label for="dictionary-item-label">{{ t('item.label') }}</Label>
                <Input
                  id="dictionary-item-label"
                  :model-value="formLabel"
                  @update:model-value="formLabel = $event"
                />
              </div>
              <div class="space-y-2">
                <Label for="dictionary-item-value">{{ t('item.value') }}</Label>
                <Input
                  id="dictionary-item-value"
                  :model-value="formValue"
                  :disabled="valueLocked"
                  placeholder="priority"
                  @update:model-value="formValue = $event"
                />
              </div>
            </template>
            <div class="space-y-2">
              <Label for="dictionary-description">
                {{ isTypeDialog ? t('type.descriptionField') : t('item.descriptionField') }}
              </Label>
              <textarea
                id="dictionary-description"
                :value="formDescription"
                rows="3"
                :maxlength="MAX_DESCRIPTION_LENGTH"
                class="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground"
                @input="formDescription = ($event.target as HTMLTextAreaElement).value"
              />
            </div>
          </template>
          <p v-if="formError" role="alert" class="text-sm text-destructive">{{ formError }}</p>
          <div class="flex justify-end gap-2">
            <Button type="button" variant="outline" :disabled="saving" @click="closeDialog">
              {{ commonT('actions.cancel') }}
            </Button>
            <Button
              type="submit"
              :variant="isDeleteDialog ? 'destructive' : 'default'"
              :disabled="isSubmitDisabled"
            >
              {{ submitLabel }}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
