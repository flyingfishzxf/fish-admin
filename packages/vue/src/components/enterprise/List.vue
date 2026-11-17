<script setup lang="ts">
import type { LucideIcon } from 'lucide-vue-next'
import { cn } from '../../lib/utils'

export interface ListItem {
  id: string
  title: string
  description?: string
  meta?: string
  icon?: LucideIcon
  disabled?: boolean
}

const props = defineProps<{
  /** Rows to render; an empty array switches to the dashed empty state. */
  items: ListItem[]
  /** Accessible name of the list element. */
  ariaLabel: string
  /** Text shown when items is empty. */
  emptyLabel: string
  /** Makes every row body a button; omit it for a read-only list. */
  onItemClick?: (item: ListItem) => void
  /** Id of the highlighted row; also sets aria-current on its button. */
  selectedId?: string
  class?: string
}>()

defineSlots<{
  actions?(props: { item: ListItem }): unknown
}>()

function isDisabled(item: ListItem) {
  return item.disabled
}
</script>

<template>
  <div
    v-if="props.items.length === 0"
    data-slot="list-empty"
    :class="
      cn(
        'rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground',
        props.class,
      )
    "
  >
    {{ props.emptyLabel }}
  </div>
  <ul
    v-else
    :aria-label="props.ariaLabel"
    data-slot="list"
    :class="cn('divide-y overflow-hidden rounded-lg border bg-background', props.class)"
  >
    <li
      v-for="item in props.items"
      :key="item.id"
      :data-selected="props.selectedId === item.id || undefined"
      :class="
        cn(
          'flex items-center gap-3 px-4 py-3 transition-colors',
          props.selectedId === item.id && 'bg-primary/5',
          isDisabled(item) && 'opacity-50',
        )
      "
    >
      <button
        v-if="props.onItemClick"
        type="button"
        :disabled="isDisabled(item)"
        :aria-current="props.selectedId === item.id ? 'true' : undefined"
        class="flex min-w-0 flex-1 items-center gap-3 rounded-md text-start outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed"
        @click="props.onItemClick?.(item)"
      >
        <span
          v-if="item.icon"
          class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
        >
          <component :is="item.icon" aria-hidden="true" class="size-4" />
        </span>
        <span class="min-w-0 flex-1 text-start">
          <span class="block truncate text-sm font-medium">{{ item.title }}</span>
          <span v-if="item.description" class="block truncate text-xs text-muted-foreground">
            {{ item.description }}
          </span>
        </span>
        <span v-if="item.meta" class="shrink-0 text-xs text-muted-foreground">{{ item.meta }}</span>
      </button>
      <div v-else class="flex min-w-0 flex-1 items-center gap-3">
        <span
          v-if="item.icon"
          class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
        >
          <component :is="item.icon" aria-hidden="true" class="size-4" />
        </span>
        <span class="min-w-0 flex-1 text-start">
          <span class="block truncate text-sm font-medium">{{ item.title }}</span>
          <span v-if="item.description" class="block truncate text-xs text-muted-foreground">
            {{ item.description }}
          </span>
        </span>
        <span v-if="item.meta" class="shrink-0 text-xs text-muted-foreground">{{ item.meta }}</span>
      </div>
      <div v-if="$slots.actions" class="flex shrink-0 items-center gap-1">
        <slot name="actions" :item="item" />
      </div>
    </li>
  </ul>
</template>
