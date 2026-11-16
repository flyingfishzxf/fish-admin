<script setup lang="ts">
import type { Project } from '@fish-admin/contracts'
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
import {
  ArrowUpRight,
  Banknote,
  FolderKanban,
  Plus,
  SearchX,
  TrendingUp,
  Wallet,
} from 'lucide-vue-next'
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

import EmptyState from '../../components/common/EmptyState.vue'
import ErrorState from '../../components/common/ErrorState.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import AlertDialog from '../../components/ui/AlertDialog.vue'
import Pagination from '../../components/ui/Pagination.vue'
import ProgressBar from '../../components/ui/ProgressBar.vue'
import Segmented from '../../components/ui/Segmented.vue'
import { formatCurrency, formatDate } from '../../lib/format'
import { language, useT } from '../../lib/i18n'
import { hasPermission } from '../../lib/permissions'
import { useTransientMessage } from '../../lib/use-transient-message'
import { useAuthStore } from '../../stores/auth'
import { archiveProject } from './api'
import ProjectCard from './ProjectCard.vue'
import ProjectCreateDialog from './ProjectCreateDialog.vue'
import ProjectKeyMark from './ProjectKeyMark.vue'
import ProjectPriorityBadge from './ProjectPriorityBadge.vue'
import ProjectStatusBadge from './ProjectStatusBadge.vue'
import {
  projectDepartmentsQueryOptions,
  projectListQueryOptions,
  projectOverviewQueryOptions,
  projectUserOptionsQueryOptions,
} from './queries'
import {
  DEFAULT_PROJECTS_SEARCH,
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  type ProjectSortKey,
  type ProjectsSearch,
} from './search'
import { flattenDepartments, portfolioOf } from './utils'

const t = useT('projects')
const auth = useAuthStore()
const queryClient = useQueryClient()
const { message: notice, show: showNotice } = useTransientMessage()

const search = reactive<ProjectsSearch>({ ...DEFAULT_PROJECTS_SEARCH })
const queryDraft = ref('')
const createOpen = ref(false)
const archiveTarget = ref<Project | null>(null)

const canManage = computed(() => hasPermission(auth.user?.permissions, 'project:manage'))

const params = computed(() => ({
  page: search.page,
  pageSize: search.pageSize,
  q: search.q,
  status: search.status,
  priority: search.priority,
  ownerId: search.ownerId,
  departmentId: search.departmentId,
  archived: search.archived,
  sort: search.sort,
  order: search.order,
}))

const list = useQuery(computed(() => projectListQueryOptions(params.value)))
const overview = useQuery(projectOverviewQueryOptions)
const users = useQuery(projectUserOptionsQueryOptions)
const departments = useQuery(projectDepartmentsQueryOptions)

const projects = computed(() => list.data.value?.items ?? [])
const total = computed(() => list.data.value?.total ?? 0)
const pageCount = computed(() => Math.max(list.data.value?.pageCount ?? 1, 1))
const portfolio = computed(() => portfolioOf(overview.data.value ?? []))
const featured = computed(() => (overview.data.value ?? []).filter((project) => project.featured))
const delta = computed(() => portfolio.value.completion - 60)
const hasFilters = computed(() =>
  Boolean(search.q || search.status || search.priority || search.ownerId || search.departmentId),
)

const ownerOptions = computed(() => users.data.value ?? [])
const departmentOptions = computed(() => flattenDepartments(departments.data.value ?? []))
const ownerLabel = computed(
  () => ownerOptions.value.find((user) => user.id === search.ownerId)?.name,
)
const departmentLabel = computed(
  () => departmentOptions.value.find((entry) => entry.value === search.departmentId)?.label,
)

// 300 ms is what the users page uses; a fast typist should not issue a request
// per keystroke against a server-sorted list.
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

const archiveMutation = useMutation({
  mutationFn: (project: Project) => archiveProject(project.id),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['projects'] })
    await queryClient.invalidateQueries({ queryKey: ['audit-events'] })
    showNotice(t('card.archived'))
  },
  onError: () => showNotice(t('card.archiveFailed')),
})

function changeFilters(patch: Partial<ProjectsSearch>) {
  Object.assign(search, { page: 1, ...patch })
}

function clearFilters() {
  queryDraft.value = ''
  changeFilters({
    q: undefined,
    status: undefined,
    priority: undefined,
    ownerId: undefined,
    departmentId: undefined,
    archived: false,
  })
}

function handleSort(key: ProjectSortKey) {
  const nextOrder = search.sort === key && search.order === 'asc' ? 'desc' : 'asc'
  changeFilters({ sort: key, order: nextOrder })
}

function setStatus(value: string) {
  changeFilters({ status: value === 'all' ? undefined : (value as ProjectsSearch['status']) })
}

function setPriority(value: string) {
  changeFilters({ priority: value === 'all' ? undefined : (value as ProjectsSearch['priority']) })
}

function setOwner(value: string) {
  changeFilters({ ownerId: value === 'all' ? undefined : value })
}

function setDepartment(value: string) {
  changeFilters({ departmentId: value === 'all' ? undefined : value })
}

function askArchive(project: Project) {
  archiveTarget.value = project
}

function closeArchive() {
  archiveTarget.value = null
}

function confirmArchive() {
  const project = archiveTarget.value
  archiveTarget.value = null
  if (project) archiveMutation.mutate(project)
}

function handleCreated() {
  showNotice(t('create.created'))
}

const emptyTitle = computed(() => (hasFilters.value ? t('empty.filteredTitle') : t('empty.title')))
const emptyDescription = computed(() =>
  hasFilters.value ? t('empty.filteredDescription') : t('empty.description'),
)
const emptyIcon = computed(() => (hasFilters.value ? SearchX : FolderKanban))

// `variables` is a ref; the card needs a plain id to show its spinner.
const archivingId = computed(() =>
  archiveMutation.isPending.value ? archiveMutation.variables.value?.id : undefined,
)
</script>

<template>
  <div class="space-y-6" data-projects-page>
    <PageHeader :title="t('title')" :description="t('subtitle')">
      <template v-if="canManage" #actions>
        <Button data-new-project @click="createOpen = true">
          <Plus class="size-4" aria-hidden="true" />
          {{ t('newProject') }}
        </Button>
      </template>
    </PageHeader>

    <p v-if="notice" role="status" class="text-sm text-success" data-projects-notice>
      {{ notice }}
    </p>

    <section class="rounded-xl border bg-card p-5" data-featured>
      <div class="space-y-1">
        <h2 class="text-base font-semibold">{{ t('featured.title') }}</h2>
        <p class="text-sm text-muted-foreground">{{ t('featured.description') }}</p>
      </div>
      <p v-if="featured.length === 0" class="pt-3 text-sm text-muted-foreground">
        {{ t('featured.empty') }}
      </p>
      <!-- Three across at xl: the seeded portfolio has three featured projects,
           and a 2-column grid pushed the KPI row below the fold. -->
      <div v-else class="grid gap-4 pt-4 md:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="project in featured"
          :key="project.id"
          class="flex flex-col gap-3 rounded-lg border bg-muted/20 p-4"
          :data-featured-project="project.id"
        >
          <div class="flex flex-wrap items-center gap-2">
            <ProjectKeyMark :project-key="project.key" />
            <ProjectStatusBadge :status="project.status" />
            <ProjectPriorityBadge :priority="project.priority" />
          </div>
          <div class="space-y-1">
            <p class="text-lg font-semibold tracking-tight">{{ project.name }}</p>
            <p class="line-clamp-2 text-sm text-muted-foreground">{{ project.description }}</p>
          </div>
          <div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span>
              {{
                t('card.budget', {
                  spent: formatCurrency(project.spent, language),
                  budget: formatCurrency(project.budget, language),
                })
              }}
            </span>
            <span>
              {{
                t('card.due', {
                  date: formatDate(project.dueDate, language, { month: 'short', day: 'numeric' }),
                })
              }}
            </span>
            <span>{{ t('card.members', { count: project.memberIds.length }) }}</span>
          </div>
          <ProgressBar
            :value="project.progress"
            :ariaLabel="t('detail.overview.progress')"
            class="max-w-md"
          />
          <Button as-child class="gap-1.5 self-start">
            <RouterLink :to="{ name: 'project-detail', params: { id: project.id } }">
              {{ t('card.open') }}
              <ArrowUpRight class="size-4" aria-hidden="true" />
            </RouterLink>
          </Button>
        </article>
      </div>
    </section>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article class="rounded-xl border bg-card p-5" data-stat="active">
        <div class="flex items-center justify-between">
          <p class="text-sm text-muted-foreground">{{ t('stats.active') }}</p>
          <FolderKanban class="size-4 text-muted-foreground" aria-hidden="true" />
        </div>
        <p class="pt-2 text-2xl font-semibold">{{ portfolio.active }}</p>
      </article>
      <article class="rounded-xl border bg-card p-5" data-stat="budget">
        <div class="flex items-center justify-between">
          <p class="text-sm text-muted-foreground">{{ t('stats.budget') }}</p>
          <Wallet class="size-4 text-muted-foreground" aria-hidden="true" />
        </div>
        <p class="pt-2 text-2xl font-semibold">{{ formatCurrency(portfolio.budget, language) }}</p>
      </article>
      <article class="rounded-xl border bg-card p-5" data-stat="spent">
        <div class="flex items-center justify-between">
          <p class="text-sm text-muted-foreground">{{ t('stats.spent') }}</p>
          <Banknote class="size-4 text-muted-foreground" aria-hidden="true" />
        </div>
        <p class="flex items-baseline gap-2 pt-2 text-2xl font-semibold">
          {{ formatCurrency(portfolio.spent, language) }}
          <span class="text-xs font-medium text-muted-foreground"
            >{{ portfolio.utilization }}%</span
          >
        </p>
      </article>
      <article class="rounded-xl border bg-card p-5" data-stat="completion">
        <div class="flex items-center justify-between">
          <p class="text-sm text-muted-foreground">{{ t('stats.completion') }}</p>
          <TrendingUp class="size-4 text-muted-foreground" aria-hidden="true" />
        </div>
        <p class="pt-2 text-2xl font-semibold">{{ portfolio.completion }}%</p>
      </article>
    </div>

    <div class="flex flex-wrap items-center justify-end gap-3">
      <p class="text-xs text-muted-foreground" data-target-delta>
        {{ delta >= 0 ? '+' : '' }}{{ delta }} {{ t('stats.vsTarget') }}
      </p>
      <Segmented
        v-model="search.view"
        data-view-switch
        :aria-label="t('view.label')"
        :options="[
          { value: 'board', label: t('view.board') },
          { value: 'list', label: t('view.list') },
        ]"
      />
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <Input
        v-model="queryDraft"
        class="min-w-52 flex-1"
        :placeholder="t('searchPlaceholder')"
        :aria-label="t('searchPlaceholder')"
        data-filters-search
      />
      <Select :model-value="search.status ?? 'all'" @update:modelValue="setStatus(String($event))">
        <SelectTrigger class="w-36" :aria-label="t('filters.status')">
          <SelectValue
            :label="search.status ? t(`status.${search.status}`) : undefined"
            :placeholder="t('filters.allStatuses')"
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{{ t('filters.allStatuses') }}</SelectItem>
          <SelectItem v-for="option in PROJECT_STATUSES" :key="option" :value="option">
            {{ t(`status.${option}`) }}
          </SelectItem>
        </SelectContent>
      </Select>
      <Select
        :model-value="search.priority ?? 'all'"
        @update:modelValue="setPriority(String($event))"
      >
        <SelectTrigger class="w-36" :aria-label="t('filters.priority')">
          <SelectValue
            :label="search.priority ? t(`priority.${search.priority}`) : undefined"
            :placeholder="t('filters.allPriorities')"
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{{ t('filters.allPriorities') }}</SelectItem>
          <SelectItem v-for="option in PROJECT_PRIORITIES" :key="option" :value="option">
            {{ t(`priority.${option}`) }}
          </SelectItem>
        </SelectContent>
      </Select>
      <Select :model-value="search.ownerId ?? 'all'" @update:modelValue="setOwner(String($event))">
        <SelectTrigger class="w-40" :aria-label="t('filters.owner')">
          <SelectValue :label="ownerLabel" :placeholder="t('filters.allOwners')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{{ t('filters.allOwners') }}</SelectItem>
          <SelectItem v-for="user in ownerOptions" :key="user.id" :value="user.id">
            {{ user.name }}
          </SelectItem>
        </SelectContent>
      </Select>
      <Select
        :model-value="search.departmentId ?? 'all'"
        @update:modelValue="setDepartment(String($event))"
      >
        <SelectTrigger class="w-44" :aria-label="t('filters.department')">
          <SelectValue :label="departmentLabel" :placeholder="t('filters.allDepartments')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{{ t('filters.allDepartments') }}</SelectItem>
          <SelectItem v-for="entry in departmentOptions" :key="entry.value" :value="entry.value">
            {{ entry.label }}
          </SelectItem>
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="sm"
        class="h-9 gap-2"
        :aria-pressed="search.archived"
        :data-archived-filter="search.archived || undefined"
        data-filters-archived
        @click="changeFilters({ archived: !search.archived })"
      >
        {{ t('filters.archived') }}
      </Button>
      <Button
        v-if="hasFilters"
        variant="ghost"
        size="sm"
        class="h-9"
        data-clear-filters
        @click="clearFilters"
      >
        {{ t('filters.clear') }}
      </Button>
    </div>

    <p class="text-sm text-muted-foreground" aria-live="polite" data-result-total>
      {{ t('pagination.summary', { total }) }}
    </p>

    <div v-if="list.isPending.value" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Skeleton v-for="index in search.pageSize" :key="index" class="h-64 w-full rounded-xl" />
    </div>
    <ErrorState
      v-else-if="list.isError.value && !list.data.value"
      :on-retry="() => list.refetch()"
    />
    <div v-else-if="projects.length === 0" class="rounded-xl border border-dashed">
      <EmptyState :icon="emptyIcon" :title="emptyTitle" :description="emptyDescription">
        <template v-if="hasFilters" #action>
          <Button variant="outline" size="sm" @click="clearFilters">{{
            t('filters.clear')
          }}</Button>
        </template>
        <template v-else-if="canManage" #action>
          <Button size="sm" @click="createOpen = true">
            <Plus class="size-4" aria-hidden="true" />
            {{ t('newProject') }}
          </Button>
        </template>
      </EmptyState>
    </div>
    <div v-else-if="search.view === 'board'" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <ProjectCard
        v-for="project in projects"
        :key="project.id"
        :project="project"
        :language="language"
        :can-manage="canManage"
        :archiving="archivingId === project.id"
        @archive="askArchive"
      />
    </div>
    <div v-else class="overflow-x-auto rounded-xl border" data-project-table>
      <table class="w-full text-sm">
        <thead class="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th class="px-3 py-2 text-start font-medium">
              <button
                type="button"
                class="inline-flex items-center gap-1 hover:text-foreground"
                :aria-label="`${t('list.name')} · ${search.sort === 'name' ? search.order : ''}`"
                data-sort="name"
                @click="handleSort('name')"
              >
                {{ t('list.name') }}
                <span aria-hidden="true" class="text-[10px]">
                  {{ search.sort === 'name' ? (search.order === 'asc' ? '▲' : '▼') : '↕' }}
                </span>
              </button>
            </th>
            <th class="px-3 py-2 text-start font-medium">{{ t('list.status') }}</th>
            <th class="px-3 py-2 text-start font-medium">{{ t('list.owner') }}</th>
            <th class="px-3 py-2 text-start font-medium">
              <button
                type="button"
                class="inline-flex items-center gap-1 hover:text-foreground"
                :aria-label="`${t('list.progress')} · ${search.sort === 'progress' ? search.order : ''}`"
                data-sort="progress"
                @click="handleSort('progress')"
              >
                {{ t('list.progress') }}
                <span aria-hidden="true" class="text-[10px]">
                  {{ search.sort === 'progress' ? (search.order === 'asc' ? '▲' : '▼') : '↕' }}
                </span>
              </button>
            </th>
            <th class="px-3 py-2 text-start font-medium">
              <button
                type="button"
                class="inline-flex items-center gap-1 hover:text-foreground"
                :aria-label="`${t('list.due')} · ${search.sort === 'dueDate' ? search.order : ''}`"
                data-sort="dueDate"
                @click="handleSort('dueDate')"
              >
                {{ t('list.due') }}
                <span aria-hidden="true" class="text-[10px]">
                  {{ search.sort === 'dueDate' ? (search.order === 'asc' ? '▲' : '▼') : '↕' }}
                </span>
              </button>
            </th>
            <th class="px-3 py-2 text-start font-medium">
              <button
                type="button"
                class="inline-flex items-center gap-1 hover:text-foreground"
                :aria-label="`${t('list.budget')} · ${search.sort === 'budget' ? search.order : ''}`"
                data-sort="budget"
                @click="handleSort('budget')"
              >
                {{ t('list.budget') }}
                <span aria-hidden="true" class="text-[10px]">
                  {{ search.sort === 'budget' ? (search.order === 'asc' ? '▲' : '▼') : '↕' }}
                </span>
              </button>
            </th>
            <th class="px-3 py-2 text-end font-medium">{{ t('list.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="project in projects"
            :key="project.id"
            class="border-t transition-colors hover:bg-muted/40"
            :data-project-row="project.id"
          >
            <td class="px-3 py-2">
              <div class="flex min-w-0 items-center gap-3">
                <ProjectKeyMark :project-key="project.key" class="size-8 rounded-lg" />
                <div class="min-w-0">
                  <RouterLink
                    :to="{ name: 'project-detail', params: { id: project.id } }"
                    class="block truncate font-medium hover:underline"
                  >
                    {{ project.name }}
                  </RouterLink>
                  <p class="truncate text-xs text-muted-foreground">{{ project.description }}</p>
                </div>
              </div>
            </td>
            <td class="px-3 py-2"><ProjectStatusBadge :status="project.status" /></td>
            <td class="px-3 py-2 text-sm whitespace-nowrap">{{ project.ownerName }}</td>
            <td class="min-w-32 px-3 py-2">
              <div class="flex items-center gap-2">
                <ProgressBar
                  :value="project.progress"
                  :ariaLabel="`${project.name} · ${t('detail.overview.progress')}`"
                  class="w-24"
                />
                <span class="text-xs text-muted-foreground">{{ project.progress }}%</span>
              </div>
            </td>
            <td class="px-3 py-2 text-sm whitespace-nowrap text-muted-foreground">
              {{ formatDate(project.dueDate, language, { month: 'short', day: 'numeric' }) }}
            </td>
            <td class="px-3 py-2 text-sm whitespace-nowrap">
              {{ formatCurrency(project.spent, language) }}
              <span class="text-muted-foreground">
                / {{ formatCurrency(project.budget, language) }}
              </span>
            </td>
            <td class="px-3 py-2 text-end">
              <Button variant="ghost" size="icon-sm" as-child>
                <RouterLink
                  :to="{ name: 'project-detail', params: { id: project.id } }"
                  :aria-label="t('card.open')"
                >
                  <ArrowUpRight class="size-4" aria-hidden="true" />
                </RouterLink>
              </Button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Pagination
      v-if="pageCount > 1"
      :page="search.page"
      :page-count="pageCount"
      data-projects-pagination
      @update:page="search.page = $event"
    />

    <ProjectCreateDialog v-model:open="createOpen" @created="handleCreated" />

    <AlertDialog
      :open="archiveTarget !== null"
      :title="t('card.archiveTitle', { project: archiveTarget?.name ?? '' })"
      :description="t('card.archiveDescription')"
      :confirm-label="t('card.archive')"
      :cancel-label="t('common:actions.cancel')"
      :pending="archiveMutation.isPending.value"
      @update:open="(open) => !open && closeArchive()"
      @confirm="confirmArchive"
    />
  </div>
</template>
