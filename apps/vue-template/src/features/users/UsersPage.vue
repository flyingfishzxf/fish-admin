<script setup lang="ts">
import type { User, UserStatus } from '@fish-admin/contracts'
import { useQuery } from '@tanstack/vue-query'
import { getCoreRowModel, useVueTable, type SortingState } from '@tanstack/vue-table'
import {
  Button,
  ProTable,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@fish-admin/vue'
import { Plus, SearchX, Users } from 'lucide-vue-next'
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'

import EmptyState from '../../components/common/EmptyState.vue'
import ErrorState from '../../components/common/ErrorState.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import { language, useT } from '../../lib/i18n'
import { hasPermission } from '../../lib/permissions'
import { useAuthStore } from '../../stores/auth'
import { createUserColumns } from './columns'
import DeleteUserDialog from './DeleteUserDialog.vue'
import { userOptionsQueryOptions, usersQueryOptions } from './queries'
import { DEFAULT_USERS_SEARCH, type UserSortKey, type UsersSearch } from './search'
import UserFormDialog from './UserFormDialog.vue'

const t = useT()
const auth = useAuthStore()

const search = reactive<UsersSearch>({ ...DEFAULT_USERS_SEARCH })
const searchValue = ref('')
const formOpen = ref(false)
const editing = ref<User | null>(null)
const deleting = ref<User | null>(null)
const feedback = ref<string | null>(null)

const granted = computed(() => auth.user?.permissions ?? [])
const canCreate = computed(() => hasPermission(granted.value, 'user:create'))
const canEdit = computed(() => hasPermission(granted.value, 'user:update'))
const canDelete = computed(() => hasPermission(granted.value, 'user:delete'))

const params = computed(() => ({
  page: search.page,
  pageSize: search.pageSize,
  q: search.q,
  status: search.status,
  sort: search.sort,
  order: search.order,
}))
const usersQuery = useQuery(usersQueryOptions(params))
const optionsQuery = useQuery(userOptionsQueryOptions)

const rows = computed(() => usersQuery.data.value?.items ?? [])
const pageCount = computed(() => Math.max(usersQuery.data.value?.pageCount ?? 1, 1))
const hasFilters = computed(() => Boolean(search.q || search.status))

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
// `SelectValue` renders the label it is given rather than the selected item text.
const statusLabel = computed(() =>
  search.status ? t(`common:status.${search.status}`) : undefined,
)

// A failed refetch keeps the last page on screen, so the stale rows get a notice
// instead of the full-page error state.
const actionError = computed(() =>
  usersQuery.isError.value && usersQuery.data.value ? t('errors:api.unknown') : null,
)

let searchTimer: ReturnType<typeof setTimeout> | undefined
let feedbackTimer: ReturnType<typeof setTimeout> | undefined

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
  if (feedbackTimer) clearTimeout(feedbackTimer)
})

function showFeedback(message: string) {
  feedback.value = message
  if (feedbackTimer) clearTimeout(feedbackTimer)
  feedbackTimer = setTimeout(() => {
    feedback.value = null
  }, 3000)
}

const sorting = computed<SortingState>(() => [{ id: search.sort, desc: search.order === 'desc' }])
const columns = computed(() =>
  createUserColumns({
    t,
    language: language.value,
    currentUserId: auth.user?.id,
    canEdit: canEdit.value,
    canDelete: canDelete.value,
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
  },
  manualSorting: true,
  manualPagination: true,
  pageCount: pageCount.value,
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

function setSearch(value: string) {
  searchValue.value = value
}

function setStatus(value: string) {
  search.status = value === 'all' ? undefined : (value as UserStatus)
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
  search.status = undefined
  search.page = 1
}

function handleSaved(action: 'created' | 'updated') {
  showFeedback(t(action === 'created' ? 'users:createSuccess' : 'users:updateSuccess'))
}

function handleDeleted() {
  const name = deleting.value?.name
  deleting.value = null
  if (name) showFeedback(t('users:delete.success', { name }))
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

    <p v-if="feedback" role="status" class="text-sm text-success">{{ feedback }}</p>
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
        :search="{
          value: searchValue,
          onChange: setSearch,
          placeholder: t('users:searchPlaceholder'),
          ariaLabel: t('common:actions.search'),
          clearLabel: t('common:actions.clearSearch'),
        }"
      >
        <template #filters>
          <Select :model-value="search.status ?? 'all'" @update:model-value="setStatus">
            <SelectTrigger class="h-9 w-[8.5rem]" :aria-label="t('users:filters.status')">
              <SelectValue :label="statusLabel" :placeholder="t('users:filters.allStatuses')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{{ t('users:filters.allStatuses') }}</SelectItem>
              <SelectItem value="active">{{ t('common:status.active') }}</SelectItem>
              <SelectItem value="invited">{{ t('common:status.invited') }}</SelectItem>
              <SelectItem value="inactive">{{ t('common:status.inactive') }}</SelectItem>
            </SelectContent>
          </Select>
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
