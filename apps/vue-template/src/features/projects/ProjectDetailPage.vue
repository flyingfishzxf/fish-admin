<script setup lang="ts">
import {
  AlertDialog,
  Button,
  EmptyState,
  ErrorState,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@fish-admin/vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { Archive, ArrowLeft, Settings2, Users } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ApiError } from '../../lib/api-error'
import { formatDate } from '../../lib/format'
import { language, useT } from '../../lib/i18n'
import { hasPermission } from '../../lib/permissions'
import { useAuthStore } from '../../stores/auth'
import { archiveProject } from './api'
import ProjectBudgetTab from './ProjectBudgetTab.vue'
import ProjectKeyMark from './ProjectKeyMark.vue'
import ProjectMembersDrawer from './ProjectMembersDrawer.vue'
import ProjectOverviewTab from './ProjectOverviewTab.vue'
import ProjectPriorityBadge from './ProjectPriorityBadge.vue'
import ProjectReviewTab from './ProjectReviewTab.vue'
import ProjectSettingsDrawer from './ProjectSettingsDrawer.vue'
import ProjectStatusBadge from './ProjectStatusBadge.vue'
import ProjectTasksTab from './ProjectTasksTab.vue'
import { projectDetailQueryOptions } from './queries'

const t = useT('projects')
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const queryClient = useQueryClient()

const projectId = computed(() => String(route.params.id ?? ''))
const query = useQuery(computed(() => projectDetailQueryOptions(projectId)))
const detail = computed(() => query.data.value ?? null)
const canManage = computed(() => hasPermission(auth.user?.permissions, 'project:manage'))

const membersOpen = ref(false)
const settingsOpen = ref(false)
const archiveOpen = ref(false)

const notFound = computed(
  () =>
    query.isError.value &&
    query.error.value instanceof ApiError &&
    query.error.value.status === 404,
)

const departmentLabel = computed(() => {
  const name = detail.value?.project.departmentName
  if (!name) return '—'
  return t(`common:departments.${name}`, { defaultValue: name })
})

const archiveMutation = useMutation({
  mutationFn: () => archiveProject(projectId.value),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['projects'] })
    await queryClient.invalidateQueries({ queryKey: ['audit-events'] })
    backToList()
  },
})

function backToList() {
  void router.push({ name: 'projects' })
}
</script>

<template>
  <div class="space-y-6" data-project-detail>
    <div v-if="query.isPending.value" class="space-y-6">
      <Skeleton class="h-8 w-40" />
      <div class="flex items-center gap-4">
        <Skeleton class="size-14 rounded-xl" />
        <div class="space-y-2">
          <Skeleton class="h-7 w-56" />
          <Skeleton class="h-4 w-80" />
        </div>
      </div>
      <Skeleton class="h-10 w-64" />
      <Skeleton class="h-80 w-full rounded-xl" />
    </div>

    <template v-else-if="notFound">
      <Button variant="ghost" size="sm" class="-ms-2" @click="backToList">
        <ArrowLeft class="size-4" aria-hidden="true" />
        {{ t('detail.back') }}
      </Button>
      <EmptyState
        :icon="Archive"
        :title="t('detail.notFoundTitle')"
        :description="t('detail.notFoundDescription')"
        data-project-not-found
      >
        <template #action>
          <Button variant="outline" @click="backToList">{{ t('detail.notFoundAction') }}</Button>
        </template>
      </EmptyState>
    </template>

    <template v-else-if="query.isError.value">
      <Button variant="ghost" size="sm" class="-ms-2" @click="backToList">
        <ArrowLeft class="size-4" aria-hidden="true" />
        {{ t('detail.back') }}
      </Button>
      <ErrorState :title="t('detail.notFoundTitle')" :on-retry="() => query.refetch()" />
    </template>

    <template v-else-if="detail">
      <div class="space-y-4">
        <Button variant="ghost" size="sm" class="-ms-2" data-back @click="backToList">
          <ArrowLeft class="size-4" aria-hidden="true" />
          {{ t('detail.back') }}
        </Button>

        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="flex min-w-0 items-start gap-4">
            <ProjectKeyMark :project-key="detail.project.key" class="size-14 rounded-2xl text-sm" />
            <div class="min-w-0 space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="text-2xl font-semibold tracking-tight" data-project-name>
                  {{ detail.project.name }}
                </h1>
                <ProjectStatusBadge :status="detail.project.status" />
                <ProjectPriorityBadge :priority="detail.project.priority" />
              </div>
              <p class="max-w-2xl text-sm text-muted-foreground">
                {{ detail.project.description }}
              </p>
              <div
                class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground"
              >
                <span>{{ t('detail.owner') }}: {{ detail.project.ownerName }}</span>
                <span>{{ t('detail.department') }}: {{ departmentLabel }}</span>
                <span>{{
                  t('detail.memberCount', { count: detail.project.memberIds.length })
                }}</span>
                <span>
                  {{
                    t('detail.due', {
                      date: formatDate(detail.project.dueDate, language, { dateStyle: 'medium' }),
                    })
                  }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <Button variant="outline" data-open-members @click="membersOpen = true">
              <Users class="size-4" aria-hidden="true" />
              {{ t('detail.members.manage') }}
            </Button>
            <Button variant="outline" data-open-settings @click="settingsOpen = true">
              <Settings2 class="size-4" aria-hidden="true" />
              {{ t('detail.settings.title') }}
            </Button>
            <Button
              v-if="canManage"
              variant="destructive"
              data-archive-project
              @click="archiveOpen = true"
            >
              <Archive class="size-4" aria-hidden="true" />
              {{ t('card.archive') }}
            </Button>
          </div>
        </div>
      </div>

      <Tabs default-value="overview">
        <TabsList data-project-tabs>
          <TabsTrigger value="overview">{{ t('detail.tabs.overview') }}</TabsTrigger>
          <TabsTrigger value="tasks">{{ t('detail.tabs.tasks') }}</TabsTrigger>
          <TabsTrigger value="budget">{{ t('detail.tabs.budget') }}</TabsTrigger>
          <TabsTrigger value="review">{{ t('detail.tabs.review') }}</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <ProjectOverviewTab :detail="detail" :can-manage="canManage" />
        </TabsContent>
        <TabsContent value="tasks">
          <ProjectTasksTab :detail="detail" :can-manage="canManage" />
        </TabsContent>
        <TabsContent value="budget">
          <ProjectBudgetTab :detail="detail" :can-manage="canManage" />
        </TabsContent>
        <TabsContent value="review">
          <ProjectReviewTab :detail="detail" :can-manage="canManage" />
        </TabsContent>
      </Tabs>

      <ProjectMembersDrawer
        v-model:open="membersOpen"
        :project="detail.project"
        @saved="query.refetch()"
      />
      <ProjectSettingsDrawer
        v-model:open="settingsOpen"
        :project="detail.project"
        :can-manage="canManage"
        @saved="query.refetch()"
        @archived="backToList"
      />

      <AlertDialog
        :open="archiveOpen"
        :title="t('card.archiveTitle', { project: detail.project.name })"
        :description="t('card.archiveDescription')"
        :confirm-label="t('card.archive')"
        :cancel-label="t('common:actions.cancel')"
        :pending="archiveMutation.isPending.value"
        @update:open="archiveOpen = $event"
        @confirm="archiveMutation.mutate()"
      />
    </template>
  </div>
</template>
