<script setup lang="ts">
import type { PermissionDefinition, PermissionGroup } from '@fish-admin/contracts/permissions'
import { PERMISSION_GROUPS } from '@fish-admin/contracts/permissions'
import { useQuery } from '@tanstack/vue-query'
import {
  Badge,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from '@fish-admin/vue'
import { KeyRound, Search } from 'lucide-vue-next'
import { computed, ref } from 'vue'

import EmptyState from '../../components/common/EmptyState.vue'
import ErrorState from '../../components/common/ErrorState.vue'
import ListPageHeader from '../../components/common/ListPageHeader.vue'
import { useT } from '../../lib/i18n'
import { permissionsQueryOptions } from './queries'

type GroupFilter = PermissionGroup | 'all'

const t = useT('permissions')
const commonT = useT('common')

const query = useQuery(permissionsQueryOptions)
const permissions = computed<PermissionDefinition[]>(() => query.data.value ?? [])

const searchValue = ref('')
const group = ref<GroupFilter>('all')

function setGroup(value: string) {
  group.value = value as GroupFilter
}

const filtered = computed(() => {
  const needle = searchValue.value.trim().toLowerCase()
  return permissions.value.filter((permission) => {
    if (group.value !== 'all' && permission.group !== group.value) return false
    if (!needle) return true
    return (
      permission.code.toLowerCase().includes(needle) ||
      permission.group.includes(needle) ||
      t(`groups.${permission.group}`).toLowerCase().includes(needle) ||
      t(permission.labelKey).toLowerCase().includes(needle)
    )
  })
})

// Iterating the contract order keeps the groups stable between renders; a group
// without matches disappears instead of rendering an empty heading.
const grouped = computed(() =>
  PERMISSION_GROUPS.map((id) => ({
    id,
    items: filtered.value.filter((permission) => permission.group === id),
  })).filter((entry) => entry.items.length > 0),
)
</script>

<template>
  <div class="space-y-6">
    <ListPageHeader :title="t('title')" :description="t('subtitle')">
      <template #actions>
        <Badge variant="secondary" class="font-normal">
          {{ t('count', { count: permissions.length }) }}
        </Badge>
      </template>
      <template #toolbar>
        <div class="relative">
          <Search
            class="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            :model-value="searchValue"
            class="h-9 ps-9 sm:w-64"
            :placeholder="t('searchPlaceholder')"
            :aria-label="commonT('actions.search')"
            @update:model-value="searchValue = $event"
          />
        </div>
        <Select :model-value="group" @update:model-value="setGroup">
          <SelectTrigger class="h-9 w-[10rem]" :aria-label="t('columns.group')">
            <SelectValue :label="group === 'all' ? t('allGroups') : t(`groups.${group}`)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{{ t('allGroups') }}</SelectItem>
            <SelectItem v-for="id in PERMISSION_GROUPS" :key="id" :value="id">
              {{ t(`groups.${id}`) }}
            </SelectItem>
          </SelectContent>
        </Select>
      </template>
    </ListPageHeader>

    <p class="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
      {{ t('readOnlyNote') }}
    </p>

    <div v-if="query.isPending.value" class="space-y-2" aria-hidden="true">
      <Skeleton v-for="index in 6" :key="index" class="h-12 w-full" />
    </div>
    <ErrorState v-else-if="query.isError.value" :on-retry="() => query.refetch()" />
    <EmptyState
      v-else-if="grouped.length === 0"
      :icon="KeyRound"
      :title="t('empty.title')"
      :description="t('empty.description')"
    />
    <div v-else class="overflow-x-auto rounded-2xl border">
      <table :aria-label="t('title')" class="w-full border-collapse text-sm">
        <thead class="bg-muted/35">
          <tr>
            <th
              scope="col"
              class="px-4 py-2.5 text-start text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
            >
              {{ t('columns.label') }}
            </th>
            <th
              scope="col"
              class="w-52 px-4 py-2.5 text-start text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
            >
              {{ t('columns.code') }}
            </th>
            <th
              scope="col"
              class="hidden px-4 py-2.5 text-start text-[11px] font-semibold tracking-wide text-muted-foreground uppercase md:table-cell"
            >
              {{ t('columns.description') }}
            </th>
          </tr>
        </thead>
        <tbody v-for="entry in grouped" :key="entry.id">
          <tr class="border-t bg-muted/25">
            <th colspan="3" scope="rowgroup" class="px-4 py-2.5 text-start">
              <span class="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                {{ t(`groups.${entry.id}`) }}
                <Badge variant="outline" class="font-normal">{{ entry.items.length }}</Badge>
              </span>
            </th>
          </tr>
          <tr v-for="permission in entry.items" :key="permission.code" class="border-t">
            <td class="px-4 py-3">
              <p class="text-sm font-medium">{{ t(permission.labelKey) }}</p>
              <p class="text-xs text-muted-foreground md:hidden">
                {{ t(permission.descriptionKey) }}
              </p>
            </td>
            <td class="px-4 py-3">
              <code
                class="rounded-md bg-muted/60 px-2 py-1 font-mono text-[11px] text-muted-foreground"
              >
                {{ permission.code }}
              </code>
            </td>
            <td class="hidden px-4 py-3 text-sm text-muted-foreground md:table-cell">
              {{ t(permission.descriptionKey) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
