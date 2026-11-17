<script setup lang="ts">
import type { WorkflowInstance } from '@fish-admin/contracts'
import {
  Button,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  Pagination,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@fish-admin/vue'
import { useQuery } from '@tanstack/vue-query'
import { Inbox, SearchX } from 'lucide-vue-next'
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import { language, useT } from '../../lib/i18n'
import { workflowListQueryOptions } from './queries'
import {
  DEFAULT_WORKFLOWS_SEARCH,
  WORKFLOW_PAGE_SIZES,
  WORKFLOW_VIEWS,
  type WorkflowSearch,
} from './search'
import WorkflowFilters from './WorkflowFilters.vue'
import WorkflowTable from './WorkflowTable.vue'

const t = useT('workflows')
const router = useRouter()

const search = reactive<WorkflowSearch>({ ...DEFAULT_WORKFLOWS_SEARCH })
const queryDraft = ref('')

const params = computed(() => ({
  page: search.page,
  pageSize: search.pageSize,
  view: search.view,
  q: search.q,
  status: search.status,
  type: search.type,
  initiatorId: search.initiatorId,
  from: search.from,
  to: search.to,
}))

const list = useQuery(computed(() => workflowListQueryOptions(params.value)))

const rows = computed(() => list.data.value?.items ?? [])
const total = computed(() => list.data.value?.total ?? 0)
const pageCount = computed(() => Math.max(list.data.value?.pageCount ?? 1, 1))
const hasFilters = computed(() =>
  Boolean(
    search.q || search.status || search.type || search.initiatorId || search.from || search.to,
  ),
)

let timer: ReturnType<typeof setTimeout> | undefined
watch(queryDraft, (value) => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    const trimmed = value.trim()
    if (trimmed === (search.q ?? '')) return
    search.q = trimmed || undefined
    search.page = 1
  }, 300)
})
onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})

function change(patch: Partial<WorkflowSearch>) {
  Object.assign(search, patch)
}

function setView(view: string) {
  change({ view: view as WorkflowSearch['view'], page: 1 })
}

function clearFilters() {
  queryDraft.value = ''
  change({
    q: undefined,
    status: undefined,
    type: undefined,
    initiatorId: undefined,
    from: undefined,
    to: undefined,
    page: 1,
  })
}

function setPageSize(value: string) {
  change({ pageSize: Number(value), page: 1 })
}

function open(instance: WorkflowInstance) {
  void router.push({ name: 'workflow-detail', params: { id: instance.id } })
}

// A bare number in the footer says nothing; the shared summary string already
// reads "Showing 1–10 of 12" in both languages.
const summary = computed(() => {
  if (total.value === 0) return ''
  const from = (search.page - 1) * search.pageSize + 1
  return t('common:table.summary', {
    from,
    to: Math.min(search.page * search.pageSize, total.value),
    total: total.value,
  })
})

const emptyTitle = computed(() =>
  hasFilters.value ? t('empty.filteredTitle') : t(`empty.${search.view}Title`),
)
const emptyDescription = computed(() =>
  hasFilters.value ? t('empty.filteredDescription') : t(`empty.${search.view}Description`),
)
</script>

<template>
  <div class="space-y-6" data-workflows-page>
    <PageHeader :title="t('title')" :description="t('subtitle')" />

    <Tabs :model-value="search.view" @update:modelValue="setView(String($event))">
      <TabsList :aria-label="t('views.label')" data-view-tabs>
        <TabsTrigger v-for="view in WORKFLOW_VIEWS" :key="view" :value="view" :data-view="view">
          {{ t(`views.${view}`) }}
        </TabsTrigger>
      </TabsList>
    </Tabs>

    <div class="space-y-3">
      <div class="flex flex-wrap items-center gap-2">
        <Input
          v-model="queryDraft"
          class="min-w-52 flex-1"
          :placeholder="t('searchPlaceholder')"
          :aria-label="t('searchPlaceholder')"
          data-workflows-search
        />
      </div>
      <WorkflowFilters
        :search="search"
        :show-clear="hasFilters"
        @change="change"
        @clear="clearFilters"
      />
    </div>

    <div v-if="list.isPending.value" class="space-y-2">
      <Skeleton v-for="index in 6" :key="index" class="h-12 w-full rounded-lg" />
    </div>
    <ErrorState
      v-else-if="list.isError.value && !list.data.value"
      :title="t('loadError')"
      :on-retry="() => list.refetch()"
    />
    <div v-else-if="rows.length === 0" class="rounded-xl border border-dashed">
      <EmptyState
        :icon="hasFilters ? SearchX : Inbox"
        :title="emptyTitle"
        :description="emptyDescription"
        data-workflows-empty
      >
        <template v-if="hasFilters" #action>
          <Button variant="outline" size="sm" data-clear-empty @click="clearFilters">
            {{ t('empty.clear') }}
          </Button>
        </template>
      </EmptyState>
    </div>
    <WorkflowTable v-else :rows="rows" :language="language" @open="open" />

    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-xs text-muted-foreground" data-workflows-total>{{ summary }}</p>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{{ t('common:table.rowsPerPage') }}</span>
          <Select
            :model-value="String(search.pageSize)"
            @update:modelValue="setPageSize(String($event))"
          >
            <SelectTrigger
              class="h-8 w-[5.5rem]"
              :aria-label="t('common:table.rowsPerPage')"
              data-page-size
            >
              <SelectValue :label="String(search.pageSize)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="size in WORKFLOW_PAGE_SIZES" :key="size" :value="String(size)">
                {{ size }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Pagination
          v-if="pageCount > 1"
          :page="search.page"
          :page-count="pageCount"
          data-workflows-pagination
          @update:page="search.page = $event"
        />
      </div>
    </div>
  </div>
</template>
