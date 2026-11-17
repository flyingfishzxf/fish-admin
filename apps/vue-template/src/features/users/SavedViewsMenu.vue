<script setup lang="ts">
import { Badge, Button, Input, Popover } from '@fish-admin/vue'
import { Bookmark, Trash2 } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'

import { useT } from '../../lib/i18n'
import { useTransientMessage } from '../../lib/use-transient-message'
import {
  createView,
  loadViews,
  MAX_NAME,
  MAX_VIEWS,
  persistViews,
  type SavedView,
} from './saved-views'
import type { UsersSearch } from './search'

const props = defineProps<{ userId?: string; search: UsersSearch }>()
const emit = defineEmits<{ apply: [view: SavedView] }>()

const t = useT()
const { message, show } = useTransientMessage()
const open = ref(false)
const name = ref('')
const views = ref<SavedView[]>([])

// The key embeds the user id, so switching accounts has to reload rather than
// show the previous account's views.
watch(
  () => props.userId,
  (userId) => {
    views.value = userId ? loadViews(userId) : []
  },
  { immediate: true },
)

const canSave = computed(() => name.value.trim().length > 0)

function saveView() {
  if (!canSave.value || !props.userId) return

  const next = [createView(name.value, props.search), ...views.value].slice(0, MAX_VIEWS)
  views.value = next
  persistViews(props.userId, next)
  name.value = ''
  show(t('users:views.saved'))
}

function deleteView(id: string) {
  if (!props.userId) return
  const next = views.value.filter((view) => view.id !== id)
  views.value = next
  persistViews(props.userId, next)
  show(t('users:views.deleted'))
}

function applyView(view: SavedView) {
  emit('apply', view)
  open.value = false
}
</script>

<template>
  <Popover v-model:open="open" class="w-72" align="end">
    <template #trigger>
      <Button variant="outline" size="sm" class="h-9 gap-2" data-saved-views>
        <Bookmark class="size-4" aria-hidden="true" />
        <span class="hidden sm:inline">{{ t('users:views.title') }}</span>
        <Badge v-if="views.length > 0" variant="secondary" class="px-1.5 font-normal">
          {{ views.length }}
        </Badge>
      </Button>
    </template>

    <div class="space-y-2 border-b p-3">
      <p class="text-xs font-medium text-muted-foreground">{{ t('users:views.saveHint') }}</p>
      <div class="flex gap-2">
        <Input
          v-model="name"
          :placeholder="t('users:views.namePlaceholder')"
          :aria-label="t('users:views.namePlaceholder')"
          :maxlength="MAX_NAME"
          class="h-8"
          data-view-name
          @keydown.enter.prevent="saveView"
        />
        <Button size="sm" class="h-8" :disabled="!canSave" data-view-save @click="saveView">
          {{ t('users:views.save') }}
        </Button>
      </div>
      <p v-if="message" role="status" class="text-xs text-success">{{ message }}</p>
    </div>

    <div class="max-h-64 overflow-y-auto p-1">
      <p v-if="views.length === 0" class="px-3 py-6 text-center text-xs text-muted-foreground">
        {{ t('users:views.empty') }}
      </p>
      <template v-else>
        <div
          v-for="view in views"
          :key="view.id"
          :data-saved-view="view.name"
          class="flex items-center gap-1 rounded-md pe-1 hover:bg-muted/60"
        >
          <button
            type="button"
            class="flex-1 truncate px-2 py-2 text-start text-sm"
            @click="applyView(view)"
          >
            {{ view.name }}
          </button>
          <Button
            variant="ghost"
            size="icon-xs"
            :aria-label="t('users:views.delete')"
            @click="deleteView(view.id)"
          >
            <Trash2 class="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      </template>
    </div>
  </Popover>
</template>
