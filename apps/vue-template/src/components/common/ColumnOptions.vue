<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table'
import { Button, Checkbox } from '@fish-admin/vue'
import { GripVertical, SlidersHorizontal } from 'lucide-vue-next'
import { computed, nextTick, ref } from 'vue'

import { useT } from '../../lib/i18n'
import Popover from '../ui/Popover.vue'

interface ColumnMeta {
  label?: string
  group?: string
  groupLabel?: string
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

const t = useT()

const groups = computed(() => {
  const map = new Map<string, { key: string; heading: string; options: Option[] }>()
  for (const column of props.table.getAllLeafColumns()) {
    if (!column.getCanHide()) continue
    const meta = (column.columnDef.meta ?? {}) as ColumnMeta
    // Grouped by the stable key, headed by the translated label: the same split
    // the table header band uses, so a language switch moves both together.
    const key = meta.group ?? ''
    const entry = map.get(key) ?? { key, heading: meta.groupLabel ?? key, options: [] }
    entry.options.push({ id: column.id, label: meta.label ?? column.id })
    map.set(key, entry)
  }
  return [...map.values()]
})

function isVisible(id: string) {
  // TanStack stores only the exceptions: an absent key means visible.
  return props.visibility[id] !== false
}

function toggle(id: string, next: boolean | 'indeterminate') {
  props.table.getColumn(id)?.toggleVisibility(next === true)
}

// --- Reordering -------------------------------------------------------------
// The same interaction React's view options offer: drag the grip, or focus it
// and press ↑/↓. The table owns the order state; the popover only asks.

const draggingId = ref<string | null>(null)
const dropTargetId = ref<string | null>(null)
const focusAfterMove = ref<string | null>(null)
const handleRefs = new Map<string, HTMLElement>()

const hintId = 'column-order-hint'

function allColumnIds() {
  return props.table.getAllLeafColumns().map((column) => column.id)
}

function moveColumn(sourceId: string, targetId: string) {
  const current = props.table.getState().columnOrder ?? []
  const baseOrder = current.length > 0 ? current : allColumnIds()
  const from = baseOrder.indexOf(sourceId)
  const to = baseOrder.indexOf(targetId)
  if (from === -1 || to === -1 || from === to) return
  const next = [...baseOrder]
  next.splice(from, 1)
  next.splice(to, 0, sourceId)
  props.table.setColumnOrder(next)
}

function clearDragState() {
  draggingId.value = null
  dropTargetId.value = null
}

function onDragStart(event: DragEvent, id: string) {
  event.dataTransfer?.setData('text/plain', id)
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
  draggingId.value = id
}

function onDragOver(event: DragEvent, id: string) {
  if (!draggingId.value) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  dropTargetId.value = id
}

function onDragLeave(event: DragEvent, id: string, element: HTMLElement) {
  if (event.relatedTarget instanceof Node && element.contains(event.relatedTarget)) return
  if (dropTargetId.value === id) dropTargetId.value = null
}

function onDrop(event: DragEvent, id: string) {
  event.preventDefault()
  const sourceId = event.dataTransfer?.getData('text/plain') || draggingId.value
  if (sourceId) moveColumn(sourceId, id)
  clearDragState()
}

async function onReorderKeydown(event: KeyboardEvent, id: string) {
  if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
  const flat = allColumnIds()
  const index = flat.indexOf(id)
  const target = flat[index + (event.key === 'ArrowUp' ? -1 : 1)]
  if (!target) return
  event.preventDefault()
  focusAfterMove.value = id
  moveColumn(id, target)
  await nextTick()
  handleRefs.get(id)?.focus()
  focusAfterMove.value = null
}

function setHandle(id: string, node: HTMLElement | null) {
  if (node) handleRefs.set(id, node)
  else handleRefs.delete(id)
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

    <div class="space-y-4 p-4">
      <p :id="hintId" class="text-xs text-muted-foreground">{{ t('table.reorderHint') }}</p>
      <div v-for="group in groups" :key="group.key" data-column-group class="space-y-1">
        <p
          v-if="group.heading"
          class="text-xs font-medium tracking-wide text-muted-foreground uppercase"
        >
          {{ group.heading }}
        </p>
        <div
          v-for="option in group.options"
          :key="option.id"
          :data-column-option="option.id"
          class="flex items-center gap-1.5 rounded-md py-0.5 ps-0.5 pe-1.5 transition-colors"
          :class="[
            draggingId === option.id && 'opacity-50',
            dropTargetId === option.id &&
              draggingId !== option.id &&
              'bg-accent ring-1 ring-primary/40',
          ]"
          @dragover="onDragOver($event, option.id)"
          @dragleave="onDragLeave($event, option.id, $event.currentTarget as HTMLElement)"
          @drop="onDrop($event, option.id)"
        >
          <button
            :ref="(node) => setHandle(option.id, node as HTMLElement | null)"
            type="button"
            draggable="true"
            :aria-label="t('table.reorderColumn', { column: option.label })"
            :aria-describedby="hintId"
            class="flex size-6 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 active:cursor-grabbing"
            :data-column-handle="option.id"
            @dragstart="onDragStart($event, option.id)"
            @dragend="clearDragState"
            @keydown="onReorderKeydown($event, option.id)"
          >
            <GripVertical class="size-4" aria-hidden="true" />
          </button>
          <label class="flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-1.5 text-sm">
            <Checkbox
              :model-value="isVisible(option.id)"
              @update:model-value="(value) => toggle(option.id, value)"
            />
            <span class="min-w-0 truncate">{{ option.label }}</span>
          </label>
        </div>
      </div>
    </div>
  </Popover>
</template>
