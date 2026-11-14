<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table'
import { Button, Checkbox } from '@fish-admin/vue'
import { SlidersHorizontal } from 'lucide-vue-next'
import { computed } from 'vue'

import Popover from '../ui/Popover.vue'

interface ColumnMeta {
  label?: string
  group?: string
}

const props = defineProps<{
  table: Table<TData>
  /** The table's visibility state. Passed in so a change repaints the ticks. */
  visibility: Record<string, boolean>
  label: string
}>()

interface Option {
  id: string
  label: string
}

const groups = computed(() => {
  const map = new Map<string, Option[]>()
  for (const column of props.table.getAllLeafColumns()) {
    if (!column.getCanHide()) continue
    const meta = (column.columnDef.meta ?? {}) as ColumnMeta
    const heading = meta.group ?? ''
    const entries = map.get(heading) ?? []
    entries.push({ id: column.id, label: meta.label ?? column.id })
    map.set(heading, entries)
  }
  return [...map.entries()].map(([heading, options]) => ({ heading, options }))
})

function isVisible(id: string) {
  // TanStack stores only the exceptions: an absent key means visible.
  return props.visibility[id] !== false
}

function toggle(id: string, next: boolean | 'indeterminate') {
  props.table.getColumn(id)?.toggleVisibility(next === true)
}
</script>

<template>
  <Popover class="w-56" align="end">
    <template #trigger>
      <Button variant="outline" size="sm" class="h-9 gap-2" data-column-options>
        <SlidersHorizontal class="size-4" aria-hidden="true" />
        <span class="hidden sm:inline">{{ label }}</span>
      </Button>
    </template>

    <div class="p-4">
      <div v-for="group in groups" :key="group.heading" data-column-group class="space-y-2">
        <p
          v-if="group.heading"
          class="text-xs font-medium tracking-wide text-muted-foreground uppercase"
        >
          {{ group.heading }}
        </p>
        <label
          v-for="option in group.options"
          :key="option.id"
          :data-column-option="option.id"
          class="flex cursor-pointer items-center gap-2 text-sm"
        >
          <Checkbox
            :model-value="isVisible(option.id)"
            @update:model-value="(value) => toggle(option.id, value)"
          />
          {{ option.label }}
        </label>
      </div>
    </div>
  </Popover>
</template>
