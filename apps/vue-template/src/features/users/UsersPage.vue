<script setup lang="ts">
import type { User, UserStatus } from '@fish-admin/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  getCoreRowModel,
  useVueTable,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/vue-table'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  ProTable,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@fish-admin/vue'
import { BadgeCheck, ChevronDown, Loader2, Plus, SearchX, Trash2, Users } from 'lucide-vue-next'
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'

import AlertDialog from '../../components/ui/AlertDialog.vue'
import EmptyState from '../../components/common/EmptyState.vue'
import ErrorState from '../../components/common/ErrorState.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import { language, useT } from '../../lib/i18n'
import { hasPermission } from '../../lib/permissions'
import { useTransientMessage } from '../../lib/use-transient-message'
import { useAuthStore } from '../../stores/auth'
import { bulkDeleteUsers, bulkUpdateUserStatus, restoreUsers } from './api'
import { createUserColumns } from './columns'
import DeleteUserDialog from './DeleteUserDialog.vue'
import { userOptionsQueryOptions, usersQueryOptions } from './queries'
import { DEFAULT_USERS_SEARCH, USER_STATUSES, type UserSortKey, type UsersSearch } from './search'
import UserFormDialog from './UserFormDialog.vue'

const t = useT()
const auth = useAuthStore()
const queryClient = useQueryClient()

const search = reactive<UsersSearch>({ ...DEFAULT_USERS_SEARCH })
const searchValue = ref('')
const formOpen = ref(false)
const editing = ref<User | null>(null)
const deleting = ref<User | null>(null)
const rowSelection = ref<RowSelectionState>({})
const bulkDeleteOpen = ref(false)
const { message: notice, action: noticeAction, show: showNotice } = useTransientMessage()

const granted = computed(() => auth.user?.permissions ?? [])
const canCreate = computed(() => hasPermission(granted.value, 'user:create'))
const canEdit = computed(() => hasPermission(granted.value, 'user:update'))
const canDelete = computed(() => hasPermission(granted.value, 'user:delete'))
const selectable = computed(() => canEdit.value || canDelete.value)

const params = computed(() => ({
  page: search.page,
  pageSize: search.pageSize,
  q: search.q,
  roleId: search.roleId,
  status: search.status,
  sort: search.sort,
  order: search.order,
}))
const usersQuery = useQuery(usersQueryOptions(params))
const optionsQuery = useQuery(userOptionsQueryOptions)

const rows = computed(() => usersQuery.data.value?.items ?? [])
const pageCount = computed(() => Math.max(usersQuery.data.value?.pageCount ?? 1, 1))
const hasFilters = computed(() => Boolean(search.q || search.roleId || search.status))

// Selection is keyed by row id, so a refetch that changes the page cannot leave
// a checkbox behind on a row that is no longer in the list.
const selectedIds = computed(() =>
  Object.entries(rowSelection.value)
    .filter(([, selected]) => selected)
    .map(([id]) => id),
)
const selectedCount = computed(() => selectedIds.value.length)

const selection = computed(() =>
  selectedCount.value > 0
    ? {
        count: selectedCount.value,
        label: t('users:bulk.selected', { count: selectedCount.value }),
        regionLabel: t('users:bulk.regionLabel'),
        clearLabel: t('users:bulk.clear'),
        onClear: clearSelection,
      }
    : undefined,
)

// The API clamps an out-of-range page to the last available one. Keep the
// requested page in step with the server response: deleting the only row on the
// final page, or a refetch that fails and later succeeds, must not leave the
// pager (and every subsequent query) pointing past the end. Placeholder data is
// skipped because it belongs to the previous query key, not to this page.
watch(
  [() => usersQuery.data.value?.pageCount, () => usersQuery.isPlaceholderData.value],
  ([availablePages, isPlaceholder]) => {
    if (isPlaceholder || availablePages === undefined) return
    const lastPage = Math.max(availablePages, 1)
    if (search.page > lastPage) search.page = lastPage
  },
)

// Any change of filter, sort or page starts a new result set; keeping ticked
// rows from the previous one would make "delete selected" ambiguous.
watch(params, () => {
  rowSelection.value = {}
})

// `SelectValue` renders the label it is given rather than the selected item text.
const statusLabel = computed(() =>
  search.status ? t(`common:status.${search.status}`) : undefined,
)
const roleLabel = computed(() =>
  search.roleId
    ? (optionsQuery.data.value?.roles ?? []).find((role) => role.id === search.roleId)?.name
    : undefined,
)

// A failed refetch keeps the last page on screen, so the stale rows get a notice
// instead of the full-page error state.
const actionError = computed(() =>
  usersQuery.isError.value && usersQuery.data.value ? t('errors:api.unknown') : null,
)

let searchTimer: ReturnType<typeof setTimeout> | undefined

watch(searchValue, (value) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    const q = value.trim()
    if ((search.q ?? '') === q) return
    search.q = q || undefined
    search.page = 1
  }, 300)
})

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer)
})

function invalidateUsers() {
  void queryClient.invalidateQueries({ queryKey: ['users'] })
  void queryClient.invalidateQueries({ queryKey: ['roles'] })
}

const statusMutation = useMutation({
  mutationFn: (input: { ids: string[]; status: UserStatus }) =>
    bulkUpdateUserStatus(input.ids, input.status),
  onSuccess: (result) => {
    clearSelection()
    invalidateUsers()
    showNotice(
      result.updated.length === 0
        ? t('users:bulk.noChanges')
        : t('users:bulk.statusSuccess', { count: result.updated.length }),
    )
  },
  onError: () => showNotice(t('users:bulk.statusError')),
})

const deleteMutation = useMutation({
  mutationFn: (ids: string[]) => bulkDeleteUsers(ids),
  onSuccess: (result) => {
    bulkDeleteOpen.value = false
    clearSelection()
    invalidateUsers()
    if (result.deleted.length === 0) {
      showNotice(t('users:bulk.noChanges'))
      return
    }
    showNotice(t('users:bulk.deleteSuccess', { count: result.deleted.length }), {
      action: { label: t('users:bulk.undo'), run: () => restoreMutation.mutate(result.deleted) },
      timeout: 8000,
    })
  },
  onError: () => showNotice(t('users:bulk.deleteError')),
})

const restoreMutation = useMutation({
  mutationFn: (ids: string[]) => restoreUsers(ids),
  onSuccess: (result) => {
    invalidateUsers()
    if (result.restored.length > 0) {
      showNotice(t('users:bulk.restoreSuccess', { count: result.restored.length }))
    }
  },
  onError: () => showNotice(t('users:bulk.restoreError')),
})

const sorting = computed<SortingState>(() => [{ id: search.sort, desc: search.order === 'desc' }])
const columns = computed(() =>
  createUserColumns({
    t,
    language: language.value,
    currentUserId: auth.user?.id,
    canEdit: canEdit.value,
    canDelete: canDelete.value,
    selectable: selectable.value,
    onEdit: (user) => {
      editing.value = user
      formOpen.value = true
    },
    onDelete: (user) => {
      deleting.value = user
    },
  }),
)

const table = useVueTable({
  // Computed refs cannot cross into table-core; the getters unwrap it at read
  // time. `data` must stay a getter too: passing the ref directly makes
  // vue-table snapshot it, and the rendered rows never follow refetches.
  get data() {
    return rows.value
  },
  get columns() {
    return columns.value
  },
  state: {
    get sorting() {
      return sorting.value
    },
    get rowSelection() {
      return rowSelection.value
    },
  },
  // Checkbox state is keyed by row id, so the ids come from the server rows.
  getRowId: (user) => user.id,
  enableRowSelection: selectable.value,
  manualSorting: true,
  manualPagination: true,
  pageCount: pageCount.value,
  onRowSelectionChange: (updater) => {
    rowSelection.value = typeof updater === 'function' ? updater(rowSelection.value) : updater
  },
  getCoreRowModel: getCoreRowModel(),
  onSortingChange: (updater) => {
    const next = typeof updater === 'function' ? updater(sorting.value) : updater
    const first = next[0]
    if (!first) return
    search.sort = first.id as UserSortKey
    search.order = first.desc ? 'desc' : 'asc'
    search.page = 1
  },
})

function clearSelection() {
  rowSelection.value = {}
}

function setSearch(value: string) {
  searchValue.value = value
}

function setStatus(value: string) {
  search.status = value === 'all' ? undefined : (value as UserStatus)
  search.page = 1
}

function setRole(value: string) {
  search.roleId = value === 'all' ? undefined : value
  search.page = 1
}

function goToPage(page: number) {
  search.page = Math.min(Math.max(page, 1), pageCount.value)
}

function openCreate() {
  editing.value = null
  formOpen.value = true
}

function clearFilters() {
  searchValue.value = ''
  search.q = undefined
  search.roleId = undefined
  search.status = undefined
  search.page = 1
}

function handleSaved(action: 'created' | 'updated') {
  showNotice(t(action === 'created' ? 'users:createSuccess' : 'users:updateSuccess'))
}

function handleDeleted() {
  const name = deleting.value?.name
  deleting.value = null
  if (name) showNotice(t('users:delete.success', { name }))
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader :title="t('users:title')" :description="t('users:subtitle')">
      <template v-if="canCreate" #actions>
        <Button @click="openCreate">
          <Plus class="size-4" aria-hidden="true" />
          {{ t('users:addUser') }}
        </Button>
      </template>
    </PageHeader>

    <p v-if="notice" role="status" class="flex items-center gap-2 text-sm text-success">
      {{ notice }}
      <Button
        v-if="noticeAction"
        variant="ghost"
        size="sm"
        data-notice-action
        class="h-7 text-success underline"
        @click="noticeAction.run()"
      >
        {{ noticeAction.label }}
      </Button>
    </p>
    <p v-if="actionError" role="alert" class="text-sm text-destructive">{{ actionError }}</p>

    <ErrorState
      v-if="usersQuery.isError.value && !usersQuery.data.value"
      :on-retry="() => usersQuery.refetch()"
    />
    <template v-else>
      <ProTable
        :table="table"
        :loading="usersQuery.isPending.value"
        :fetching="usersQuery.isFetching.value && !usersQuery.isPending.value"
        :fetching-label="t('common:states.loading')"
        :table-label="t('users:tableRegion')"
        :selection="selection"
        :search="{
          value: searchValue,
          onChange: setSearch,
          placeholder: t('users:searchPlaceholder'),
          ariaLabel: t('common:actions.search'),
          clearLabel: t('common:actions.clearSearch'),
        }"
      >
        <template #filters>
          <Select :model-value="search.roleId ?? 'all'" @update:model-value="setRole">
            <SelectTrigger class="h-9 w-[9.5rem]" :aria-label="t('users:filters.role')">
              <SelectValue :label="roleLabel" :placeholder="t('users:filters.allRoles')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{{ t('users:filters.allRoles') }}</SelectItem>
              <SelectItem
                v-for="role in optionsQuery.data.value?.roles ?? []"
                :key="role.id"
                :value="role.id"
              >
                {{ role.name }}
              </SelectItem>
            </SelectContent>
          </Select>

          <Select :model-value="search.status ?? 'all'" @update:model-value="setStatus">
            <SelectTrigger class="h-9 w-[8.5rem]" :aria-label="t('users:filters.status')">
              <SelectValue :label="statusLabel" :placeholder="t('users:filters.allStatuses')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{{ t('users:filters.allStatuses') }}</SelectItem>
              <SelectItem v-for="status in USER_STATUSES" :key="status" :value="status">
                {{ t(`common:status.${status}`) }}
              </SelectItem>
            </SelectContent>
          </Select>

          <Button v-if="hasFilters" variant="ghost" size="sm" class="h-9" @click="clearFilters">
            {{ t('users:actions.resetFilters') }}
          </Button>
        </template>

        <template #selection-actions>
          <DropdownMenu v-if="canEdit">
            <DropdownMenuTrigger :as-child="true">
              <Button variant="outline" size="sm" :disabled="statusMutation.isPending.value">
                <Loader2
                  v-if="statusMutation.isPending.value"
                  class="size-4 animate-spin"
                  aria-hidden="true"
                />
                <BadgeCheck v-else class="size-4" aria-hidden="true" />
                {{ t('users:bulk.setStatus') }}
                <ChevronDown class="size-3.5" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="center" class="w-44">
              <DropdownMenuLabel>{{ t('users:bulk.setStatus') }}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                v-for="status in USER_STATUSES"
                :key="status"
                @select="statusMutation.mutate({ ids: selectedIds, status })"
              >
                {{ t(`common:status.${status}`) }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button v-if="canDelete" variant="destructive" size="sm" @click="bulkDeleteOpen = true">
            <Trash2 class="size-4" aria-hidden="true" />
            {{ t('users:bulk.delete') }}
          </Button>
        </template>

        <template #empty>
          <EmptyState
            v-if="hasFilters"
            :icon="SearchX"
            :title="t('users:noResults.title')"
            :description="t('users:noResults.description')"
          >
            <template #action>
              <Button variant="outline" size="sm" @click="clearFilters">
                {{ t('users:noResults.action') }}
              </Button>
            </template>
          </EmptyState>
          <EmptyState
            v-else
            :icon="Users"
            :title="t('users:empty.title')"
            :description="t('users:empty.description')"
          >
            <template v-if="canCreate" #action>
              <Button size="sm" @click="openCreate">
                <Plus class="size-4" aria-hidden="true" />
                {{ t('users:empty.action') }}
              </Button>
            </template>
          </EmptyState>
        </template>
      </ProTable>

      <div class="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>{{ t('common:table.pageOf', { page: search.page, pageCount }) }}</span>
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="search.page <= 1"
            :aria-label="t('common:table.previous')"
            @click="goToPage(search.page - 1)"
          >
            ←
          </Button>
          <Button
            variant="outline"
            size="sm"
            :disabled="search.page >= pageCount"
            :aria-label="t('common:table.next')"
            @click="goToPage(search.page + 1)"
          >
            →
          </Button>
        </div>
      </div>
    </template>

    <AlertDialog
      v-model:open="bulkDeleteOpen"
      :title="t('users:bulk.deleteTitle', { count: selectedCount })"
      :description="t('users:bulk.deleteDescription')"
      :confirm-label="t('users:bulk.deleteConfirm', { count: selectedCount })"
      :cancel-label="t('common:actions.cancel')"
      :pending="deleteMutation.isPending.value"
      @confirm="deleteMutation.mutate(selectedIds)"
    />

    <UserFormDialog
      v-model:open="formOpen"
      :user="editing"
      :roles="optionsQuery.data.value?.roles ?? []"
      :departments="optionsQuery.data.value?.departments ?? []"
      @saved="handleSaved"
    />
    <DeleteUserDialog :user="deleting" @update:user="deleting = $event" @deleted="handleDeleted" />
  </div>
</template>
