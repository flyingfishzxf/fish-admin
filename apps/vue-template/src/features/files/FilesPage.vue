<script setup lang="ts">
import type { WorkspaceFile } from '@fish-admin/contracts'
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from '@fish-admin/vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { FolderOpen, Star, UploadCloud, X } from 'lucide-vue-next'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'

import DetailDrawer from '../../components/common/DetailDrawer.vue'
import EmptyState from '../../components/common/EmptyState.vue'
import ErrorState from '../../components/common/ErrorState.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import AlertDialog from '../../components/ui/AlertDialog.vue'
import FolderTree from '../../components/ui/FolderTree.vue'
import Pagination from '../../components/ui/Pagination.vue'
import Segmented from '../../components/ui/Segmented.vue'
import { language, useT } from '../../lib/i18n'
import { hasPermission } from '../../lib/permissions'
import { useTransientMessage } from '../../lib/use-transient-message'
import { useAuthStore } from '../../stores/auth'
import { deleteFile, deleteFiles, updateFile, type FileUpdateInput } from './api'
import FileGrid from './FileGrid.vue'
import FileListTable from './FileListTable.vue'
import FilePreviewPanel from './FilePreviewPanel.vue'
import FileUploadDialog from './FileUploadDialog.vue'
import { isPreviewable } from './file-meta'
import { folderBreadcrumb } from './folder-utils'
import { fileFoldersQueryOptions, fileListQueryOptions } from './queries'
import {
  DEFAULT_FILES_SEARCH,
  type FileKind,
  type FileVisibilityFilter,
  type FilesSearch,
} from './search'

const t = useT('files')
const auth = useAuthStore()
const queryClient = useQueryClient()
const { message: notice, show: showNotice } = useTransientMessage()

const search = reactive<FilesSearch>({ ...DEFAULT_FILES_SEARCH })
const selectedId = ref<string | null>(null)
const selectedIds = ref<Set<string>>(new Set())
const uploadOpen = ref(false)
const previewOpen = ref(false)
const bulkOpen = ref(false)
const confirmingDelete = ref<WorkspaceFile | null>(null)

const canManage = computed(() => hasPermission(auth.user?.permissions, 'file:manage'))

const params = computed(() => ({
  page: search.page,
  pageSize: search.pageSize,
  folderId: search.folderId,
  q: search.q,
  kind: search.kind,
  visibility: search.visibility === 'all' ? undefined : search.visibility,
  favorite: search.favorite,
  sort: search.sort,
  order: search.order,
  updatedAfter: search.updatedAfter,
}))

const foldersQuery = useQuery(fileFoldersQueryOptions)
const listQuery = useQuery(computed(() => fileListQueryOptions(params.value)))

const files = computed(() => listQuery.data.value?.items ?? [])
const pageCount = computed(() => listQuery.data.value?.pageCount ?? 1)
const total = computed(() => listQuery.data.value?.total ?? 0)
const folders = computed(() => foldersQuery.data.value?.folders ?? [])
const selectedFile = computed(
  () => files.value.find((file) => file.id === selectedId.value) ?? null,
)
const images = computed(() => files.value.filter((file) => isPreviewable(file)))
const breadcrumb = computed(() =>
  search.folderId ? folderBreadcrumb(folders.value, search.folderId) : [],
)
const summary = computed(() => {
  if (total.value === 0) return ''
  const from = (search.page - 1) * search.pageSize + 1
  return t('common:table.summary', {
    from,
    to: Math.min(search.page * search.pageSize, total.value),
    total: total.value,
  })
})

// The desktop split shows the preview in a column; below `lg` the same panel
// opens in a drawer, so a phone never gets a stranded extra block.
const wide = ref(true)
let media: MediaQueryList | null = null
function syncWide(event: MediaQueryList | MediaQueryListEvent) {
  wide.value = event.matches
}
onMounted(() => {
  if (typeof window.matchMedia !== 'function') return
  media = window.matchMedia('(min-width: 1024px)')
  syncWide(media)
  // jsdom's MediaQueryList is a stub without listener methods.
  media.addEventListener?.('change', syncWide)
})
onBeforeUnmount(() => media?.removeEventListener?.('change', syncWide))

// Any filter change starts a new result set: keeping the selection would let
// "delete selected" act on rows the user can no longer see.
watch(
  () => [
    search.folderId,
    search.q,
    search.kind,
    search.visibility,
    search.favorite,
    search.updatedAfter,
  ],
  () => {
    selectedIds.value = new Set()
  },
)

watch(
  () => files.value,
  (next) => {
    if (next.length === 0) {
      selectedId.value = null
      return
    }
    if (!selectedId.value || !next.some((file) => file.id === selectedId.value)) {
      selectedId.value = next[0]?.id ?? null
    }
  },
)

function invalidate() {
  return queryClient.invalidateQueries({ queryKey: ['files'] })
}

const updateMutation = useMutation({
  mutationFn: ({ id, input }: { id: string; input: FileUpdateInput }) => updateFile(id, input),
  onSuccess: () => {
    void invalidate()
  },
  onError: () => showNotice(t('errors.update')),
})

const deleteMutation = useMutation({
  mutationFn: deleteFile,
  onSuccess: async (_data, id) => {
    showNotice(t('toasts.deleted'))
    const next = new Set(selectedIds.value)
    next.delete(id)
    selectedIds.value = next
    await invalidate()
  },
  onError: () => showNotice(t('errors.delete')),
})

const bulkMutation = useMutation({
  mutationFn: deleteFiles,
  onSuccess: async (result) => {
    showNotice(t('toasts.bulkDeleted', { count: result.deleted }))
    selectedIds.value = new Set()
    bulkOpen.value = false
    await invalidate()
  },
  onError: () => showNotice(t('errors.delete')),
})

const kindOptions = computed(() =>
  (['all', 'image', 'document', 'data'] as FileKind[]).map((kind) => ({
    value: kind,
    label: t(`filters.kinds.${kind}`),
  })),
)
const kindLabel = computed(
  () => kindOptions.value.find((option) => option.value === search.kind)?.label,
)
const visibilityLabel = computed(
  () => visibilityOptions.value.find((option) => option.value === search.visibility)?.label,
)
const visibilityOptions = computed(() =>
  (['all', 'team', 'private'] as FileVisibilityFilter[]).map((visibility) => ({
    value: visibility,
    label: t(`filters.visibilities.${visibility}`),
  })),
)

function changeFilters(patch: Partial<FilesSearch>) {
  Object.assign(search, { page: 1, ...patch })
}

function setQuery(value: string) {
  changeFilters({ q: value.trim() || undefined })
}

function setKind(value: string) {
  changeFilters({ kind: value as FileKind })
}

function setVisibilityFilter(value: string) {
  changeFilters({ visibility: value as FileVisibilityFilter })
}

function setUpdatedAfter(value: string) {
  changeFilters({ updatedAfter: value || undefined })
}

function selectFolder(folderId?: string) {
  changeFilters({ folderId })
}

function clearSelection() {
  selectedIds.value = new Set()
}

function openFile(file: WorkspaceFile) {
  selectedId.value = file.id
  if (!wide.value) previewOpen.value = true
}

function toggleSelected(id: string, checked: boolean) {
  const next = new Set(selectedIds.value)
  if (checked) next.add(id)
  else next.delete(id)
  selectedIds.value = next
}

function toggleAll(checked: boolean) {
  selectedIds.value = checked ? new Set(files.value.map((file) => file.id)) : new Set()
}

function toggleFavorite(file: WorkspaceFile) {
  updateMutation.mutate(
    { id: file.id, input: { favorite: !file.favorite } },
    {
      onSuccess: () =>
        showNotice(t(file.favorite ? 'toasts.favoriteRemoved' : 'toasts.favoriteAdded')),
    },
  )
}

function moveFile(file: WorkspaceFile, folderId: string) {
  return updateMutation
    .mutateAsync({ id: file.id, input: { folderId } })
    .then(() => {
      showNotice(t('toasts.moved'))
    })
    .catch(() => undefined)
}

async function renameFile(file: WorkspaceFile, name: string) {
  try {
    await updateMutation.mutateAsync({ id: file.id, input: { name } })
    showNotice(t('toasts.updated'))
    return true
  } catch {
    return false
  }
}

function changeVisibility(file: WorkspaceFile, visibility: WorkspaceFile['visibility']) {
  updateMutation.mutate(
    { id: file.id, input: { visibility } },
    { onSuccess: () => showNotice(t('toasts.updated')) },
  )
}

function askDelete(file: WorkspaceFile) {
  confirmingDelete.value = file
}

function deleteSelected() {
  // Read the ref in script: spreading the template proxy yields the ref, not
  // the ids it holds.
  bulkMutation.mutate([...selectedIds.value])
}

function closeDelete() {
  confirmingDelete.value = null
}

function confirmDelete() {
  const file = confirmingDelete.value
  confirmingDelete.value = null
  if (file) deleteMutation.mutate(file.id)
}

function handleUploaded(file: WorkspaceFile) {
  selectedId.value = file.id
  showNotice(t('toasts.uploaded'))
}

const gridLabels = computed(() => ({
  selectFile: (name: string) => t('list.selectFile', { name }),
  openFile: (name: string) => t('list.openFile', { name }),
  favorite: (name: string) => t('actions.favoriteNamed', { name }),
  unfavorite: (name: string) => t('actions.unfavoriteNamed', { name }),
  delete: (name: string) => t('list.delete', { name }),
  private: t('item.private'),
  favoriteBadge: t('item.favorite'),
}))

const tableLabels = computed(() => ({
  selectAll: t('list.selectAll'),
  selectFile: (name: string) => t('list.selectFile', { name }),
  openFile: (name: string) => t('list.openFile', { name }),
  favorite: (name: string) => t('actions.favoriteNamed', { name }),
  unfavorite: (name: string) => t('actions.unfavoriteNamed', { name }),
  delete: (name: string) => t('list.delete', { name }),
  private: t('item.private'),
  team: t('item.team'),
  name: t('list.name'),
  type: t('list.type'),
  size: t('list.size'),
  visibility: t('list.visibility'),
  updated: t('list.updated'),
  actions: t('list.actions'),
}))
</script>

<template>
  <div class="space-y-6" data-files-page>
    <PageHeader :title="t('title')" :description="t('subtitle')">
      <template v-if="canManage" #actions>
        <Button data-upload-open @click="uploadOpen = true">
          <UploadCloud class="size-4" aria-hidden="true" />
          {{ t('actions.upload') }}
        </Button>
      </template>
    </PageHeader>

    <p v-if="notice" role="status" class="text-sm text-success" data-files-notice>{{ notice }}</p>

    <div
      v-if="selectedIds.size > 0"
      class="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-muted/40 px-3 py-2"
      data-files-selection
    >
      <p class="text-sm font-medium">{{ t('selection.count', { count: selectedIds.size }) }}</p>
      <div class="flex items-center gap-2">
        <Button variant="ghost" size="sm" data-clear-selection @click="clearSelection">
          <X class="size-4" aria-hidden="true" />
          {{ t('selection.clear') }}
        </Button>
        <Button
          v-if="canManage"
          variant="destructive"
          size="sm"
          data-bulk-delete
          @click="bulkOpen = true"
        >
          {{ t('selection.delete', { count: selectedIds.size }) }}
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside class="h-fit rounded-xl border bg-card p-4" data-files-folders>
        <p class="pb-2 text-sm font-semibold">{{ t('folders.title') }}</p>
        <div v-if="foldersQuery.isPending.value" class="space-y-2">
          <Skeleton v-for="index in 4" :key="index" class="h-7 w-full" />
        </div>
        <ErrorState
          v-else-if="foldersQuery.isError.value"
          :on-retry="() => foldersQuery.refetch()"
        />
        <FolderTree
          v-else
          :folders="folders"
          :selected-id="search.folderId"
          :all-label="t('folders.all')"
          :total="foldersQuery.data.value?.total ?? 0"
          :empty-label="t('folders.empty')"
          :ariaLabel="t('folders.ariaLabel')"
          @select="selectFolder"
        />
      </aside>

      <section class="min-w-0 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <nav :aria-label="t('title')" class="flex flex-wrap items-center gap-1 text-sm">
            <button
              type="button"
              class="hover:underline"
              data-breadcrumb-root
              @click="selectFolder(undefined)"
            >
              {{ t('title') }}
            </button>
            <template v-for="(folder, index) in breadcrumb" :key="folder.id">
              <span aria-hidden="true" class="text-muted-foreground">/</span>
              <button
                v-if="index < breadcrumb.length - 1"
                type="button"
                class="hover:underline"
                :data-breadcrumb="folder.id"
                @click="selectFolder(folder.id)"
              >
                {{ folder.name }}
              </button>
              <span v-else class="font-medium" data-breadcrumb-current>{{ folder.name }}</span>
            </template>
            <template v-if="search.favorite">
              <span aria-hidden="true" class="text-muted-foreground">/</span>
              <span class="font-medium">{{ t('folders.favorites') }}</span>
            </template>
          </nav>
          <Segmented
            v-model="search.view"
            data-view-switch
            :aria-label="t('filters.viewAria')"
            :options="[
              { value: 'grid', label: t('filters.viewGrid') },
              { value: 'list', label: t('filters.viewList') },
            ]"
          />
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <Input
            :model-value="search.q ?? ''"
            class="min-w-52 flex-1"
            :placeholder="t('filters.searchPlaceholder')"
            :aria-label="t('filters.searchAria')"
            data-filters-search
            @update:modelValue="setQuery(String($event))"
          />
          <Select :model-value="search.kind" @update:modelValue="setKind(String($event))">
            <SelectTrigger class="w-36" :aria-label="t('filters.kindAria')">
              <SelectValue :label="kindLabel" :placeholder="t('filters.kind')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in kindOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
          <Select
            :model-value="search.visibility"
            @update:modelValue="setVisibilityFilter(String($event))"
          >
            <SelectTrigger class="w-36" :aria-label="t('filters.visibilityAria')">
              <SelectValue :label="visibilityLabel" :placeholder="t('filters.visibility')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in visibilityOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
          <div class="flex items-center gap-1">
            <Input
              type="date"
              class="w-40"
              :model-value="search.updatedAfter ?? ''"
              :aria-label="t('filters.updatedAfter')"
              :max="new Date().toISOString().slice(0, 10)"
              data-filters-date
              @update:modelValue="setUpdatedAfter(String($event))"
            />
            <Button
              v-if="search.updatedAfter"
              variant="ghost"
              size="icon-sm"
              :aria-label="t('filters.clearDate')"
              data-clear-date
              @click="setUpdatedAfter('')"
            >
              <X class="size-4" aria-hidden="true" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            class="h-9 gap-2"
            :aria-pressed="search.favorite"
            :data-favorite-filter="search.favorite || undefined"
            data-filters-favorite
            @click="changeFilters({ favorite: !search.favorite })"
          >
            <Star
              class="size-4"
              :class="search.favorite && 'fill-warning text-warning'"
              aria-hidden="true"
            />
            {{ t('filters.favorite') }}
          </Button>
        </div>

        <div class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div class="min-w-0 space-y-3">
            <div
              v-if="listQuery.isPending.value"
              class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
            >
              <Skeleton v-for="index in 6" :key="index" class="h-56 w-full" />
            </div>
            <ErrorState v-else-if="listQuery.isError.value" :on-retry="() => listQuery.refetch()" />
            <EmptyState
              v-else-if="files.length === 0"
              :icon="FolderOpen"
              :title="t('list.emptyTitle')"
              :description="t('list.emptyDescription')"
            >
              <template v-if="canManage" #action>
                <Button data-empty-upload @click="uploadOpen = true">
                  <UploadCloud class="size-4" aria-hidden="true" />
                  {{ t('actions.upload') }}
                </Button>
              </template>
            </EmptyState>
            <FileListTable
              v-else-if="search.view === 'list'"
              :files="files"
              :selected-id="selectedId"
              :selected-ids="selectedIds"
              :can-manage="canManage"
              :language="language"
              :labels="tableLabels"
              @open="openFile"
              @toggle-selected="toggleSelected"
              @toggle-all="toggleAll"
              @toggle-favorite="toggleFavorite"
              @remove="askDelete"
            />
            <FileGrid
              v-else
              :files="files"
              :selected-id="selectedId"
              :selected-ids="selectedIds"
              :can-manage="canManage"
              :language="language"
              :labels="gridLabels"
              @open="openFile"
              @toggle-selected="toggleSelected"
              @toggle-favorite="toggleFavorite"
              @remove="askDelete"
            />

            <Pagination
              v-if="pageCount > 1"
              :page="search.page"
              :page-count="pageCount"
              data-files-pagination
              @update:page="search.page = $event"
            />
            <p v-if="summary" class="text-xs text-muted-foreground" data-files-summary>
              {{ summary }}
            </p>
          </div>

          <aside class="hidden xl:block">
            <div class="sticky top-4 rounded-xl border bg-card p-4" data-files-preview>
              <FilePreviewPanel
                :file="selectedFile"
                :images="images"
                :folders="folders"
                :language="language"
                :can-manage="canManage"
                :deleting="deleteMutation.isPending.value"
                :on-toggle-favorite="toggleFavorite"
                :on-move="moveFile"
                :on-rename="renameFile"
                :on-visibility-change="changeVisibility"
                :on-delete="askDelete"
                :on-open="openFile"
              />
            </div>
          </aside>
        </div>
      </section>
    </div>

    <DetailDrawer
      :open="previewOpen"
      :title="t('preview.title')"
      :description="selectedFile?.name ?? t('preview.emptyTitle')"
      @update:open="previewOpen = $event"
    >
      <FilePreviewPanel
        :file="selectedFile"
        :images="images"
        :folders="folders"
        :language="language"
        :can-manage="canManage"
        :deleting="deleteMutation.isPending.value"
        :on-toggle-favorite="toggleFavorite"
        :on-move="moveFile"
        :on-rename="renameFile"
        :on-visibility-change="changeVisibility"
        :on-delete="askDelete"
        :on-open="openFile"
      />
    </DetailDrawer>

    <FileUploadDialog
      v-model:open="uploadOpen"
      :folders="folders"
      :default-folder-id="search.folderId"
      @uploaded="handleUploaded"
    />

    <AlertDialog
      v-model:open="bulkOpen"
      :title="t('selection.deleteTitle')"
      :description="t('selection.deleteDescription', { count: selectedIds.size })"
      :confirm-label="t('actions.delete')"
      :cancel-label="t('preview.cancel')"
      :pending="bulkMutation.isPending.value"
      @confirm="deleteSelected"
    />

    <AlertDialog
      :open="confirmingDelete !== null"
      :title="t('list.deleteTitle')"
      :description="t('list.deleteDescription', { name: confirmingDelete?.name ?? '' })"
      :confirm-label="t('actions.delete')"
      :cancel-label="t('preview.cancel')"
      :pending="deleteMutation.isPending.value"
      @update:open="(open) => !open && closeDelete()"
      @confirm="confirmDelete"
    />
  </div>
</template>
