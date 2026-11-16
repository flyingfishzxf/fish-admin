<script setup lang="ts">
import type { Project } from '@fish-admin/contracts'
import { Badge, Button, Checkbox, Input } from '@fish-admin/vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, ref, watch } from 'vue'

import DetailDrawer from '../../components/common/DetailDrawer.vue'
import { useT } from '../../lib/i18n'
import { updateProject } from './api'
import { projectUserOptionsQueryOptions } from './queries'

const props = defineProps<{ project: Project; open: boolean }>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: []
}>()

const t = useT('projects')
const queryClient = useQueryClient()
const users = useQuery(projectUserOptionsQueryOptions)

const selected = ref<string[]>([])
const search = ref('')

watch(
  () => [props.open, props.project.id] as const,
  ([open]) => {
    if (!open) return
    selected.value = [...props.project.memberIds]
    search.value = ''
  },
  { immediate: true },
)

const candidates = computed(() => {
  const term = search.value.trim().toLowerCase()
  return (users.data.value ?? [])
    .filter((user) =>
      term
        ? user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term)
        : true,
    )
    .map((user) => ({
      ...user,
      isOwner: user.id === props.project.ownerId,
      checked: selected.value.includes(user.id) || user.id === props.project.ownerId,
    }))
})

const saveMutation = useMutation({
  // The owner is always a member: the endpoint would accept a list without them,
  // but a project whose owner cannot see it is a bug waiting to happen.
  mutationFn: () =>
    updateProject(props.project.id, {
      memberIds: Array.from(new Set([props.project.ownerId, ...selected.value])),
    }),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['projects'] })
    await queryClient.invalidateQueries({ queryKey: ['audit-events'] })
    emit('saved')
    emit('update:open', false)
  },
})

function toggle(id: string, checked: boolean) {
  if (id === props.project.ownerId) return
  const next = new Set(selected.value)
  if (checked) next.add(id)
  else next.delete(id)
  selected.value = [...next]
}
</script>

<template>
  <DetailDrawer
    :open="props.open"
    :title="t('detail.members.title')"
    :description="t('detail.members.description')"
    @update:open="emit('update:open', $event)"
  >
    <div class="space-y-3" data-members-drawer>
      <Input
        v-model="search"
        :placeholder="t('detail.members.search')"
        :aria-label="t('detail.members.search')"
        data-members-search
      />

      <ul class="space-y-1" data-members-list>
        <li
          v-for="user in candidates"
          :key="user.id"
          class="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60"
          :data-member-option="user.id"
        >
          <Checkbox
            :model-value="user.checked"
            :disabled="user.isOwner"
            :aria-label="user.name"
            @update:modelValue="toggle(user.id, $event === true)"
          />
          <span class="min-w-0 flex-1">
            <span class="block truncate font-medium">{{ user.name }}</span>
            <span class="block truncate text-xs text-muted-foreground">
              {{ [user.jobTitle, user.email].filter(Boolean).join(' · ') }}
            </span>
          </span>
          <Badge v-if="user.isOwner" variant="secondary">{{ t('detail.members.owner') }}</Badge>
        </li>
        <li v-if="candidates.length === 0" class="px-2 py-3 text-sm text-muted-foreground">
          {{ t('detail.members.empty') }}
        </li>
      </ul>

      <div class="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        <span class="text-xs text-muted-foreground">
          {{ t('detail.memberCount', { count: selected.length }) }}
        </span>
        <div class="flex gap-2">
          <Button variant="outline" @click="emit('update:open', false)">
            {{ t('common:actions.cancel') }}
          </Button>
          <Button
            :disabled="saveMutation.isPending.value"
            data-members-save
            @click="saveMutation.mutate()"
          >
            {{ t('detail.members.save') }}
          </Button>
        </div>
      </div>
    </div>
  </DetailDrawer>
</template>
