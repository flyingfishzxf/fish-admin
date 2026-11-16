<script setup lang="ts">
import type { Project } from '@fish-admin/contracts'
import { Button, Input, Label } from '@fish-admin/vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { ref, watch } from 'vue'

import DetailDrawer from '../../components/common/DetailDrawer.vue'
import TagsInput from '../../components/ui/TagsInput.vue'
import { useT } from '../../lib/i18n'
import { archiveProject, updateProject } from './api'

const props = defineProps<{ project: Project; open: boolean; canManage: boolean }>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: []
  archived: []
}>()

const t = useT('projects')
const queryClient = useQueryClient()

const tags = ref<string[]>([])
const reminderTime = ref('')
const archiveOpen = ref(false)

watch(
  () => [props.open, props.project.id] as const,
  ([open]) => {
    if (!open) return
    tags.value = [...props.project.tags]
    reminderTime.value = props.project.reminderTime?.slice(0, 5) ?? ''
    archiveOpen.value = false
  },
  { immediate: true },
)

function invalidate() {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['projects'] }),
    queryClient.invalidateQueries({ queryKey: ['audit-events'] }),
  ])
}

const saveMutation = useMutation({
  mutationFn: () =>
    updateProject(props.project.id, { tags: tags.value, reminderTime: reminderTime.value }),
  onSuccess: async () => {
    await invalidate()
    emit('saved')
    emit('update:open', false)
  },
})

const archiveMutation = useMutation({
  mutationFn: () => archiveProject(props.project.id),
  onSuccess: async () => {
    await invalidate()
    emit('archived')
    emit('update:open', false)
  },
})
</script>

<template>
  <DetailDrawer
    :open="props.open"
    :title="t('detail.settings.title')"
    :description="t('detail.settings.description')"
    @update:open="emit('update:open', $event)"
  >
    <div class="space-y-5" data-settings-drawer>
      <div class="space-y-1.5">
        <Label>{{ t('detail.settings.tags') }}</Label>
        <TagsInput
          v-model="tags"
          :aria-label="t('detail.settings.tags')"
          :placeholder="t('fields.tagsPlaceholder')"
          :disabled="!props.canManage"
        />
        <p class="text-xs text-muted-foreground">{{ t('detail.settings.tagsHint') }}</p>
      </div>

      <div class="space-y-1.5">
        <Label for="project-reminder">{{ t('detail.settings.reminder') }}</Label>
        <Input
          id="project-reminder"
          v-model="reminderTime"
          type="time"
          :disabled="!props.canManage"
          :aria-label="t('detail.settings.reminder')"
          data-settings-reminder
        />
        <p class="text-xs text-muted-foreground">{{ t('detail.settings.reminderHint') }}</p>
      </div>

      <div v-if="props.canManage" class="space-y-2 rounded-lg border border-destructive/30 p-3">
        <p class="text-sm font-medium text-destructive">{{ t('detail.settings.danger') }}</p>
        <p class="text-xs text-muted-foreground">{{ t('detail.settings.dangerHint') }}</p>
        <p v-if="archiveOpen" class="text-sm" data-archive-confirm>
          {{ t('detail.settings.archiveDescription') }}
        </p>
        <div class="flex flex-wrap gap-2">
          <Button
            v-if="!archiveOpen"
            variant="destructive"
            size="sm"
            data-settings-archive
            @click="archiveOpen = true"
          >
            {{ t('detail.settings.archive') }}
          </Button>
          <template v-else>
            <Button
              variant="destructive"
              size="sm"
              :disabled="archiveMutation.isPending.value"
              data-settings-archive-confirm
              @click="archiveMutation.mutate()"
            >
              {{ t('detail.settings.archive') }}
            </Button>
            <Button variant="outline" size="sm" @click="archiveOpen = false">
              {{ t('common:actions.cancel') }}
            </Button>
          </template>
        </div>
      </div>

      <div class="flex justify-end gap-2 border-t pt-3">
        <Button variant="outline" @click="emit('update:open', false)">
          {{ t('common:actions.cancel') }}
        </Button>
        <Button
          :disabled="!props.canManage || saveMutation.isPending.value"
          data-settings-save
          @click="saveMutation.mutate()"
        >
          {{ t('detail.settings.save') }}
        </Button>
      </div>
    </div>
  </DetailDrawer>
</template>
