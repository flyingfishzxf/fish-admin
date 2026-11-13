<script setup lang="ts">
import type { Role } from '@fish-admin/contracts'
import type { PermissionDefinition, PermissionGroup } from '@fish-admin/contracts/permissions'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { Button, Checkbox } from '@fish-admin/vue'
import { ArrowLeft } from 'lucide-vue-next'
import { computed, onBeforeUnmount, ref } from 'vue'
import { RouterLink } from 'vue-router'

import EmptyState from '../../components/common/EmptyState.vue'
import ErrorState from '../../components/common/ErrorState.vue'
import ListPageHeader from '../../components/common/ListPageHeader.vue'
import { ApiError } from '../../lib/api-error'
import { useT } from '../../lib/i18n'
import { hasPermission } from '../../lib/permissions'
import { useAuthStore } from '../../stores/auth'
import { updateRolePermissions } from './api'
import {
  expandWildcard,
  groupState,
  isImmutableRole,
  permissionsEqual,
  toggleGroupSelection,
} from './permissions'
import { permissionsQueryOptions, rolesQueryOptions } from './queries'

const t = useT('roles')
const commonT = useT('common')
const errorsT = useT('errors')

const queryClient = useQueryClient()
const auth = useAuthStore()
const rolesQuery = useQuery(rolesQueryOptions)
const permissionsQuery = useQuery(permissionsQueryOptions)

const roles = computed<Role[]>(() => rolesQuery.data.value ?? [])
const permissions = computed<PermissionDefinition[]>(() => permissionsQuery.data.value ?? [])
const granted = computed(() => auth.user?.permissions ?? [])
const canUpdate = computed(() => hasPermission(granted.value, 'role:update'))

// The API stores `*` for the seeded admin role. Editing concrete codes needs the
// expanded list, otherwise every admin checkbox would render unchecked.
const baseline = computed<Record<string, string[]>>(() => {
  const map: Record<string, string[]> = {}
  for (const role of roles.value) map[role.id] = expandWildcard(role.permissions)
  return map
})

const draft = ref<Record<string, string[]> | null>(null)
const effective = computed(() => draft.value ?? baseline.value)

const changedRoles = computed(() =>
  roles.value.filter((role) => {
    if (isImmutableRole(role)) return false
    return !permissionsEqual(effective.value[role.id] ?? [], baseline.value[role.id] ?? [])
  }),
)

const groups = computed(() => {
  const map = new Map<PermissionGroup, PermissionDefinition[]>()
  for (const permission of permissions.value) {
    const bucket = map.get(permission.group)
    if (bucket) bucket.push(permission)
    else map.set(permission.group, [permission])
  }
  return [...map.entries()]
})

const loading = computed(() => rolesQuery.isPending.value || permissionsQuery.isPending.value)
const errored = computed(() => rolesQuery.isError.value || permissionsQuery.isError.value)
// Either query failing leaves the matrix without its columns or its rows, so
// both failures must surface here instead of rendering a half-empty table.
const showError = computed(
  () => errored.value && (roles.value.length === 0 || permissions.value.length === 0),
)

function retry() {
  void rolesQuery.refetch()
  void permissionsQuery.refetch()
}

const saving = ref(false)
const saveError = ref<string | null>(null)
const feedback = ref<string | null>(null)
const sessionHint = ref(false)

let feedbackTimer: ReturnType<typeof setTimeout> | undefined

function showFeedback(message: string) {
  feedback.value = message
  if (feedbackTimer) clearTimeout(feedbackTimer)
  feedbackTimer = setTimeout(() => {
    feedback.value = null
  }, 4000)
}

onBeforeUnmount(() => {
  if (feedbackTimer) clearTimeout(feedbackTimer)
})

function selectedCodes(role: Role) {
  return effective.value[role.id] ?? []
}

function setRolePermissions(role: Role, next: string[]) {
  draft.value = { ...(draft.value ?? baseline.value), [role.id]: next }
  feedback.value = null
  saveError.value = null
  sessionHint.value = false
}

function togglePermission(role: Role, code: string, checked: boolean) {
  const current = selectedCodes(role)
  setRolePermissions(
    role,
    checked ? [...new Set([...current, code])] : current.filter((item) => item !== code),
  )
}

function toggleGroup(role: Role, codes: string[]) {
  setRolePermissions(role, toggleGroupSelection(selectedCodes(role), codes))
}

function groupCheckboxValue(role: Role, items: PermissionDefinition[]): boolean | 'indeterminate' {
  const state = groupState(
    selectedCodes(role),
    items.map((item) => item.code),
  )
  if (state === 'all') return true
  return state === 'some' ? 'indeterminate' : false
}

// A locked cell is read-only for three different reasons; keeping the predicate
// in one place stops the two checkbox templates from drifting apart.
function isLocked(role: Role) {
  return !canUpdate.value || isImmutableRole(role) || saving.value
}

function discard() {
  draft.value = null
  saveError.value = null
  sessionHint.value = false
}

async function save() {
  const pending = changedRoles.value
  if (pending.length === 0 || saving.value) return

  saving.value = true
  saveError.value = null
  const touchesOwnRole = pending.some((role) => role.id === auth.user?.roleId)

  try {
    // The API takes one role per request, so a multi-role edit is a short
    // sequence. Stopping at the first failure keeps the draft for a retry.
    for (const role of pending) {
      const saved = await updateRolePermissions(role.id, effective.value[role.id] ?? [])
      // Write the response into the cache before invalidating: if the refetch
      // fails, the table still shows what the server just acknowledged instead
      // of silently falling back to the stale baseline.
      queryClient.setQueryData<Role[]>(
        ['roles'],
        (current) => current?.map((item) => (item.id === saved.id ? saved : item)) ?? current,
      )
    }
    await queryClient.invalidateQueries({ queryKey: ['roles'] })
    draft.value = null
    showFeedback(t('matrix.saved'))
    sessionHint.value = touchesOwnRole
  } catch (cause) {
    const code = cause instanceof ApiError ? cause.code : ''
    if (code === 'PROTECTED_ROLE') saveError.value = t('protected')
    else if (cause instanceof ApiError && cause.status === 403)
      saveError.value = errorsT('api.forbidden')
    else saveError.value = t('matrix.saveError')
    // Another admin may have changed the role between load and save; resync the
    // baseline but keep the draft so the user's work is not lost. Roles already
    // saved now match the cache, so a retry only resubmits the failed ones.
    void queryClient.invalidateQueries({ queryKey: ['roles'] })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <ListPageHeader :title="t('matrix.title')" :description="t('matrix.subtitle')">
      <template #actions>
        <Button variant="outline" as-child>
          <RouterLink to="/roles">
            <ArrowLeft class="size-4" aria-hidden="true" />
            {{ t('matrix.back') }}
          </RouterLink>
        </Button>
      </template>
    </ListPageHeader>

    <p
      v-if="!canUpdate"
      class="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground"
    >
      {{ t('matrix.readOnly') }}
    </p>

    <p v-if="feedback" role="status" class="text-sm text-success">{{ feedback }}</p>
    <p v-if="sessionHint" role="status" class="text-sm text-muted-foreground">
      {{ t('refreshHint') }}
    </p>
    <p v-if="saveError" role="alert" class="text-sm text-destructive">{{ saveError }}</p>

    <ErrorState v-if="showError" :on-retry="retry" />
    <p
      v-else-if="loading && (roles.length === 0 || permissions.length === 0)"
      role="status"
      class="text-sm text-muted-foreground"
    >
      {{ commonT('states.loading') }}
    </p>
    <EmptyState
      v-else-if="roles.length === 0"
      :title="t('empty.title')"
      :description="t('empty.description')"
    />
    <div
      v-else
      role="region"
      :aria-label="t('matrix.title')"
      tabindex="0"
      class="max-h-[calc(100vh-17rem)] overflow-auto rounded-xl border outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <table :aria-label="t('matrix.tableLabel')" class="w-full border-collapse text-sm">
        <thead class="sticky top-0 z-20 bg-background shadow-[0_1px_0_0_var(--border)]">
          <tr>
            <th
              scope="col"
              class="sticky start-0 z-30 min-w-64 bg-background px-4 py-3 text-start text-xs font-semibold tracking-wide text-muted-foreground uppercase"
            >
              {{ t('matrix.permission') }}
            </th>
            <th
              v-for="role in roles"
              :key="role.id"
              scope="col"
              class="min-w-40 border-s px-3 py-2 text-center align-middle"
            >
              <div class="flex items-center justify-center gap-1.5">
                <span class="truncate text-sm font-semibold">{{ role.name }}</span>
                <span
                  v-if="role.isSystem"
                  class="rounded border px-1.5 py-0.5 text-xs font-normal text-muted-foreground"
                >
                  {{ t('system') }}
                </span>
              </div>
              <p
                v-if="isImmutableRole(role)"
                class="mt-1 text-[10px] font-normal text-muted-foreground"
              >
                {{ t('matrix.lockedRole') }}
              </p>
            </th>
          </tr>
        </thead>

        <tbody v-for="[group, items] in groups" :key="group">
          <tr class="border-t bg-muted/40">
            <th
              scope="row"
              class="sticky start-0 z-10 bg-muted/40 px-4 py-2 text-start text-xs font-semibold tracking-wide text-muted-foreground uppercase"
            >
              {{ t(`groups.${group}`) }}
            </th>
            <td v-for="role in roles" :key="role.id" class="border-s px-3 py-2 text-center">
              <Checkbox
                :model-value="groupCheckboxValue(role, items)"
                :disabled="isLocked(role)"
                :aria-label="
                  t('matrix.groupToggle', { role: role.name, group: t(`groups.${group}`) })
                "
                :data-role-id="role.id"
                :data-group="group"
                @update:model-value="
                  toggleGroup(
                    role,
                    items.map((item) => item.code),
                  )
                "
              />
            </td>
          </tr>

          <tr v-for="permission in items" :key="permission.code" class="border-t">
            <th
              scope="row"
              class="sticky start-0 z-10 bg-background px-4 py-2.5 text-start font-normal"
            >
              <span class="block text-sm">{{ t(permission.labelKey) }}</span>
              <code class="block font-mono text-[10px] text-muted-foreground">
                {{ permission.code }}
              </code>
            </th>
            <td v-for="role in roles" :key="role.id" class="border-s px-3 py-2.5 text-center">
              <Checkbox
                :model-value="selectedCodes(role).includes(permission.code)"
                :disabled="isLocked(role)"
                :aria-label="
                  t('matrix.permissionToggle', {
                    role: role.name,
                    permission: t(permission.labelKey),
                  })
                "
                :data-role-id="role.id"
                :data-permission="permission.code"
                @update:model-value="togglePermission(role, permission.code, $event === true)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="changedRoles.length > 0"
      role="region"
      :aria-label="t('matrix.changesRegion')"
      class="sticky bottom-4 z-30 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background/95 px-4 py-3 shadow-lg backdrop-blur"
    >
      <span class="text-sm font-medium">
        {{ t('matrix.changes', { count: changedRoles.length }) }}
      </span>
      <div class="flex items-center gap-2">
        <Button variant="ghost" size="sm" :disabled="saving" @click="discard">
          {{ t('matrix.discard') }}
        </Button>
        <Button size="sm" :disabled="saving" @click="save">
          {{ t('matrix.save') }}
        </Button>
      </div>
    </div>
  </div>
</template>
