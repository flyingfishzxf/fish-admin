<script setup lang="ts">
import { cn } from '../../lib/utils'

export interface DescriptionItem {
  term: string
  description: string
  /** Spans two of the `sm` columns. */
  span?: 1 | 2
}

const props = withDefaults(
  defineProps<{
    /** Term/description pairs rendered in source order. */
    items: DescriptionItem[]
    /** Column count from the `sm` breakpoint up; the base layout is one column. */
    columns?: 1 | 2 | 3
    class?: string
  }>(),
  { columns: 2 },
)

const COLUMN_CLASSES: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
}
</script>

<template>
  <dl :class="cn('grid grid-cols-1 gap-x-8 gap-y-4', COLUMN_CLASSES[props.columns], props.class)">
    <div
      v-for="(item, index) in props.items"
      :key="index"
      :class="cn('min-w-0 space-y-1', item.span === 2 && 'sm:col-span-2')"
    >
      <dt class="text-xs font-medium text-muted-foreground">{{ item.term }}</dt>
      <dd class="text-sm break-words">{{ item.description }}</dd>
    </div>
  </dl>
</template>
