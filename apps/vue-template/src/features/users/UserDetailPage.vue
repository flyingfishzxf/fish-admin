<script setup lang="ts">
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@fish-admin/vue'
import { useQuery } from '@tanstack/vue-query'
import { ArrowLeft, Building2, Pencil, ShieldCheck, Trash2, UserRoundSearch } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import EmptyState from '../../components/common/EmptyState.vue'
import ErrorState from '../../components/common/ErrorState.vue'
import { ApiError } from '../../lib/api-error'
import { formatDate } from '../../lib/format'
import { getInitials } from '../../lib/initials'
import { language, useT } from '../../lib/i18n'
import { hasPermission } from '../../lib/permissions'
import { useAuthStore } from '../../stores/auth'
import DeleteUserDialog from './DeleteUserDialog.vue'
import { userDetailQueryOptions, userOptionsQueryOptions } from './queries'
import UserActivityTab from './UserActivityTab.vue'
import UserFormDialog from './UserFormDialog.vue'
import UserOverview from './UserOverview.vue'
import UserStatusBadge from './UserStatusBadge.vue'

const t = useT()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const userId = computed(() => String(route.params.id ?? ''))
const query = useQuery(computed(() => userDetailQueryOptions(userId)))
const options = useQuery(userOptionsQueryOptions)

const canEdit = computed(() => hasPermission(auth.user?.permissions, 'user:update'))
const canDelete = computed(() => hasPermission(auth.user?.permissions, 'user:delete'))
const canReadAudit = computed(() => hasPermission(auth.user?.permissions, 'audit:read'))

const formOpen = ref(false)
const deleting = ref(false)

const notFound = computed(
  () =>
    query.isError.value &&
    query.error.value instanceof ApiError &&
    query.error.value.status === 404,
)

const departmentLabel = computed(() => {
  const user = query.data.value
  if (!user) return ''
  return t(`common:departments.${user.department}`, { defaultValue: user.department })
})

function goBack() {
  if (window.history.length > 1) {
    router.back()
    return
  }
  void router.push({ name: 'users' })
}

function backToList() {
  void router.push({ name: 'users' })
}
</script>

<template>
  <div class="space-y-6" data-user-detail>
    <div v-if="query.isPending.value" class="space-y-6" data-slot="user-detail-skeleton">
      <Skeleton class="h-8 w-32" />
      <div class="flex items-center gap-4">
        <Skeleton class="size-16 rounded-full" />
        <div class="space-y-2">
          <Skeleton class="h-7 w-48" />
          <Skeleton class="h-4 w-64" />
          <Skeleton class="h-4 w-40" />
        </div>
      </div>
      <Skeleton class="h-10 w-56" />
      <Skeleton class="h-80 w-full rounded-2xl" />
    </div>

    <EmptyState
      v-else-if="notFound"
      :icon="UserRoundSearch"
      :title="t('users:detail.notFoundTitle')"
      :description="t('users:detail.notFoundDescription')"
      data-user-not-found
    >
      <template #action>
        <Button variant="outline" @click="backToList">
          <ArrowLeft class="size-4" aria-hidden="true" />
          {{ t('users:detail.back') }}
        </Button>
      </template>
    </EmptyState>

    <ErrorState
      v-else-if="query.isError.value"
      :title="t('users:detail.notFoundTitle')"
      :on-retry="() => query.refetch()"
    />

    <template v-else-if="query.data.value">
      <div class="space-y-4">
        <Button variant="ghost" size="sm" class="-ms-2" data-action="back" @click="goBack">
          <ArrowLeft class="size-4" aria-hidden="true" />
          {{ t('users:detail.back') }}
        </Button>

        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="flex min-w-0 items-start gap-4">
            <Avatar class="size-16">
              <AvatarImage v-if="query.data.value.avatar" :src="query.data.value.avatar" alt="" />
              <AvatarFallback class="bg-brand-soft text-lg font-semibold text-primary">
                {{ getInitials(query.data.value.name) }}
              </AvatarFallback>
            </Avatar>
            <div class="min-w-0 space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="text-2xl font-semibold tracking-tight" data-user-name>
                  {{ query.data.value.name }}
                </h1>
                <UserStatusBadge :status="query.data.value.status" />
              </div>
              <p class="text-sm text-muted-foreground">{{ query.data.value.email }}</p>
              <div
                class="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground"
              >
                <span class="inline-flex items-center gap-1.5">
                  <ShieldCheck class="size-3.5" aria-hidden="true" />
                  {{ query.data.value.roleName }}
                </span>
                <span class="inline-flex items-center gap-1.5">
                  <Building2 class="size-3.5" aria-hidden="true" />
                  {{ departmentLabel }}
                </span>
                <span>
                  {{ t('users:detail.joined') }}:
                  {{
                    formatDate(query.data.value.createdAt, language, { dateStyle: 'medium' })
                  }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <Button v-if="canEdit" data-action="edit-user" @click="formOpen = true">
              <Pencil class="size-4" aria-hidden="true" />
              {{ t('users:actions.edit') }}
            </Button>
            <Button
              v-if="canDelete && query.data.value.id !== auth.user?.id"
              variant="outline"
              data-action="delete-user"
              @click="deleting = true"
            >
              <Trash2 class="size-4" aria-hidden="true" />
              {{ t('users:actions.delete') }}
            </Button>
          </div>
        </div>
      </div>

      <Tabs default-value="overview">
        <TabsList data-slot="user-detail-tabs">
          <TabsTrigger value="overview">{{ t('users:detail.tabs.overview') }}</TabsTrigger>
          <TabsTrigger v-if="canReadAudit" value="activity">
            {{ t('users:detail.tabs.activity') }}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <UserOverview :user="query.data.value" :can-edit="canEdit" />
        </TabsContent>
        <TabsContent v-if="canReadAudit" value="activity">
          <UserActivityTab :user-id="query.data.value.id" />
        </TabsContent>
      </Tabs>

      <UserFormDialog
        v-if="canEdit"
        v-model:open="formOpen"
        :user="query.data.value"
        :roles="options.data.value?.roles ?? []"
        :departments="options.data.value?.departments ?? []"
      />
      <DeleteUserDialog
        :user="deleting ? query.data.value : null"
        @update:user="deleting = false"
        @deleted="backToList"
      />
    </template>
  </div>
</template>
