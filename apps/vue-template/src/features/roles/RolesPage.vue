<script setup lang="ts">
import type { Role } from '@fish-admin/contracts'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { getCoreRowModel, useVueTable, type ColumnDef } from '@tanstack/vue-table'
import {
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
  ProTable,
} from '@fish-admin/vue'
import { Pencil, Plus, Trash2 } from 'lucide-vue-next'
import { computed, h, onBeforeUnmount, ref, watch, type VNode } from 'vue'
import { RouterLink } from 'vue-router'

import ListPageHeader from '../../components/common/ListPageHeader.vue'
import { ApiError } from '../../lib/api-error'
import { useT } from '../../lib/i18n'
import { clampToPageCount } from '../../lib/list-page'
import { hasPermission } from '../../lib/permissions'
import { useAuthStore } from '../../stores/auth'
import { createRole, deleteRole, updateRole } from './api'
import { rolesQueryOptions } from './queries'

type DialogMode = 'create' | 'rename' | 'delete'

const t = useT('roles')
const commonT = useT('common')
const usersT = useT('users')
const permissionsT = useT('permissions')
const validationT = useT('validation')

const MAX_DESCRIPTION_LENGTH = 200
const queryClient = useQueryClient()
const auth = useAuthStore()
const query = useQuery(rolesQueryOptions)

const roles = computed<Role[]>(() => query.data.value ?? [])
const searchValue = ref('')
const filtered = computed(() => {
  const needle = searchValue.value.trim().toLowerCase()
  if (!needle) return roles.value
  return roles.value.filter(
    (role) =>
      role.name.toLowerCase().includes(needle) || role.description.toLowerCase().includes(needle),
  )
})

const PAGE_SIZE = 10
const page = ref(1)
const pageCount = computed(() => Math.max(Math.ceil(filtered.value.length / PAGE_SIZE), 1))
const visibleRows = computed(() =>
  filtered.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE),
)

watch([pageCount, () => query.isPlaceholderData.value], ([availablePages, isPlaceholder]) => {
  page.value = clampToPageCount(page.value, availablePages, isPlaceholder)
})

function setSearch(value: string) {
  searchValue.value = value
  page.value = 1
}

function goToPage(next: number) {
  page.value = Math.min(Math.max(next, 1), pageCount.value)
}

const granted = computed(() => auth.user?.permissions ?? [])
const canCreate = computed(() => hasPermission(granted.value, 'role:create'))
const canUpdate = computed(() => hasPermission(granted.value, 'role:update'))
const canDelete = computed(() => hasPermission(granted.value, 'role:delete'))
const readOnly = computed(() => !canCreate.value && !canUpdate.value && !canDelete.value)

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

const dialogMode = ref<DialogMode | null>(null)
const activeRole = ref<Role | null>(null)
const formName = ref('')
const formDescription = ref('')
const formError = ref<string | null>(null)
const saving = ref(false)

const isFormNameValid = computed(() => {
  const length = formName.value.trim().length
  return length >= 2 && length <= 40
})
const isFormDescriptionValid = computed(
  () => formDescription.value.trim().length <= MAX_DESCRIPTION_LENGTH,
)
const isSubmitDisabled = computed(() => {
  if (saving.value) return true
  if (dialogMode.value === 'delete') return false
  if (!isFormNameValid.value) return true
  return dialogMode.value === 'create' && !isFormDescriptionValid.value
})

function openDialog(mode: DialogMode, role: Role | null = null) {
  dialogMode.value = mode
  activeRole.value = role
  formName.value = mode === 'rename' ? (role?.name ?? '') : ''
  formDescription.value = ''
  formError.value = null
  feedback.value = null
}

function closeDialog() {
  dialogMode.value = null
  activeRole.value = null
}

const dialogTitle = computed(() => {
  if (dialogMode.value === 'rename')
    return t('rename.title', { role: activeRole.value?.name ?? '' })
  if (dialogMode.value === 'delete') {
    return t('deleteRole.title', { role: activeRole.value?.name ?? '' })
  }
  return t('wizard.title')
})

const dialogDescription = computed(() => {
  if (dialogMode.value === 'rename') return t('rename.description')
  if (dialogMode.value === 'delete') return t('deleteRole.description')
  // The single dialog replaces React's two-step wizard, which also chose
  // permissions; that step belongs to the matrix in Task 5.
  return t('wizard.basicDescription')
})

const submitLabel = computed(() => {
  if (dialogMode.value === 'delete') return t('deleteRole.confirm')
  if (dialogMode.value === 'rename') return t('rename.save')
  return t('wizard.create')
})

function errorMessage(mode: DialogMode, cause: unknown): string {
  const code = cause instanceof ApiError ? cause.code : ''
  if (code === 'ROLE_NAME_TAKEN') return t('wizard.nameTaken')
  // VALIDATION_ERROR can also come from the description or a permission list;
  // a name-specific message would be misleading, so use the generic one.
  if (code === 'VALIDATION_ERROR') return validationT('fixErrors')
  if (code === 'PROTECTED_ROLE') return t('protected')
  if (code === 'ROLE_NOT_FOUND') return t('deleteRole.error')
  if (mode === 'delete') {
    return code === 'ROLE_IN_USE' ? t('deleteRole.inUse') : t('deleteRole.error')
  }
  if (mode === 'rename') return t('rename.error')
  return t('wizard.createError')
}

async function submitDialog() {
  const mode = dialogMode.value
  if (saving.value || !mode) return
  const name = formName.value.trim()
  if ((mode === 'create' || mode === 'rename') && !isFormNameValid.value) {
    formError.value = t('wizard.nameInvalid')
    return
  }
  if (mode === 'create' && !isFormDescriptionValid.value) {
    formError.value = validationT('maxLength', {
      field: t('wizard.descriptionField'),
      max: MAX_DESCRIPTION_LENGTH,
    })
    return
  }

  saving.value = true
  formError.value = null
  try {
    if (mode === 'create') {
      await createRole({ name, description: formDescription.value.trim() })
      showFeedback(t('wizard.created'))
    } else if (mode === 'rename' && activeRole.value) {
      await updateRole(activeRole.value.id, { name })
      showFeedback(t('rename.success'))
    } else if (mode === 'delete' && activeRole.value) {
      await deleteRole(activeRole.value.id)
      showFeedback(t('deleteRole.success'))
    }
    await queryClient.invalidateQueries({ queryKey: ['roles'] })
    closeDialog()
  } catch (cause) {
    formError.value = errorMessage(mode, cause)
  } finally {
    saving.value = false
  }
}

const columns = computed<ColumnDef<Role>[]>(() => {
  // Read the permission refs here so the cell closures stay in sync.
  const update = canUpdate.value
  const remove = canDelete.value

  return [
    {
      accessorKey: 'name',
      header: () => t('wizard.name'),
      cell: ({ row }) =>
        h('div', { class: 'flex items-center gap-2' }, [
          h('span', { class: 'font-medium' }, row.original.name),
          ...(row.original.isSystem
            ? [
                h(
                  'span',
                  { class: 'rounded border px-1.5 py-0.5 text-xs text-muted-foreground' },
                  t('system'),
                ),
              ]
            : []),
        ]),
    },
    {
      accessorKey: 'description',
      header: () => t('wizard.descriptionField'),
      cell: ({ row }) => row.original.description,
    },
    {
      id: 'permissions',
      header: () => permissionsT('title'),
      cell: ({ row }) =>
        row.original.permissions.includes('*')
          ? t('wildcard')
          : t('permissionsCount', { count: row.original.permissions.length }),
    },
    {
      accessorKey: 'userCount',
      header: () => usersT('title'),
      cell: ({ row }) => t('usersCount', { count: row.original.userCount }),
    },
    {
      id: 'actions',
      header: () => h('span', { class: 'sr-only' }, commonT('actions.more')),
      cell: ({ row }) => {
        const role = row.original
        const buttons: VNode[] = []
        if (update && !role.isSystem) {
          buttons.push(
            h(
              Button,
              {
                variant: 'ghost',
                size: 'icon-sm',
                'aria-label': `${t('rename.action')} ${role.name}`,
                'data-role-id': role.id,
                'data-action': 'rename',
                onClick: () => openDialog('rename', role),
              },
              () => h(Pencil, { class: 'size-4', 'aria-hidden': 'true' }),
            ),
          )
        }
        if (remove && !role.isSystem) {
          buttons.push(
            h(
              Button,
              {
                variant: 'ghost',
                size: 'icon-sm',
                'aria-label': `${t('deleteRole.action')} ${role.name}`,
                'data-role-id': role.id,
                'data-action': 'delete',
                onClick: () => openDialog('delete', role),
              },
              () => h(Trash2, { class: 'size-4', 'aria-hidden': 'true' }),
            ),
          )
        }
        return h('div', { class: 'flex justify-end gap-1' }, buttons)
      },
    },
  ]
})

const table = useVueTable({
  get data() {
    return visibleRows.value
  },
  get columns() {
    return columns.value
  },
  get pageCount() {
    return pageCount.value
  },
  manualPagination: true,
  enableSorting: false,
  getCoreRowModel: getCoreRowModel(),
})
</script>

<template>
  <div class="space-y-6">
    <ListPageHeader :title="t('title')" :description="t('subtitle')">
      <template #actions>
        <Button variant="outline" as-child>
          <RouterLink to="/roles/matrix">{{ t('permissionMatrix') }}</RouterLink>
        </Button>
        <Button v-if="canCreate" @click="openDialog('create')">
          <Plus class="size-4" aria-hidden="true" />
          {{ t('newRole') }}
        </Button>
      </template>
    </ListPageHeader>

    <p v-if="feedback" role="status" class="text-sm text-success">{{ feedback }}</p>
    <p v-if="readOnly" class="text-sm text-muted-foreground">{{ t('readOnly') }}</p>

    <ErrorState v-if="query.isError.value && !roles.length" :on-retry="() => query.refetch()" />
    <template v-else>
      <p v-if="query.isError.value" role="alert" class="text-sm text-destructive">
        {{ commonT('states.error.description') }}
      </p>
      <ProTable
        :table="table"
        :loading="query.isPending.value"
        :fetching="query.isFetching.value && !query.isPending.value"
        :fetching-label="commonT('states.loading')"
        :table-label="t('title')"
        :search="{
          value: searchValue,
          onChange: setSearch,
          placeholder: t('searchPlaceholder'),
          ariaLabel: commonT('actions.search'),
          clearLabel: commonT('actions.clearSearch'),
        }"
      >
        <template #empty>
          <EmptyState :title="t('empty.title')" :description="t('empty.description')" />
        </template>
      </ProTable>

      <div class="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>{{ commonT('table.pageOf', { page, pageCount }) }}</span>
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="page <= 1"
            :aria-label="commonT('table.previous')"
            @click="goToPage(page - 1)"
          >
            ←
          </Button>
          <Button
            variant="outline"
            size="sm"
            :disabled="page >= pageCount"
            :aria-label="commonT('table.next')"
            @click="goToPage(page + 1)"
          >
            →
          </Button>
        </div>
      </div>
    </template>

    <Dialog :open="dialogMode !== null" @update:open="!$event && closeDialog()">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ dialogTitle }}</DialogTitle>
          <DialogDescription>{{ dialogDescription }}</DialogDescription>
        </DialogHeader>
        <form class="space-y-4" @submit.prevent="submitDialog">
          <template v-if="dialogMode === 'create' || dialogMode === 'rename'">
            <div class="space-y-2">
              <Label for="role-name">{{ t('wizard.name') }}</Label>
              <Input
                id="role-name"
                :model-value="formName"
                :placeholder="t('wizard.namePlaceholder')"
                @update:model-value="formName = $event"
              />
            </div>
            <div v-if="dialogMode === 'create'" class="space-y-2">
              <Label for="role-description">{{ t('wizard.descriptionField') }}</Label>
              <Input
                id="role-description"
                :model-value="formDescription"
                :placeholder="t('wizard.descriptionPlaceholder')"
                @update:model-value="formDescription = $event"
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
              :variant="dialogMode === 'delete' ? 'destructive' : 'default'"
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
