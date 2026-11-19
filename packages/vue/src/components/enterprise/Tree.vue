<script setup lang="ts">
import { ChevronRight, type LucideIcon } from 'lucide-vue-next'
import { computed, ref, watch, type ComponentPublicInstance } from 'vue'

import { buildTree, treeAncestorIds, visibleTreeEntries } from '../../lib/tree'
import { useUITranslation } from '../../i18n'
import { cn } from '../../lib/utils'

export interface TreeItem {
  id: string
  parentId: string | null
  label: string
  description?: string
  badge?: string
  icon?: LucideIcon
  disabled?: boolean
}

const props = defineProps<{
  /** Flat records linked by `parentId`; unknown parents become roots. */
  items: TreeItem[]
  /** Currently selected node id, or `null` for none. */
  selectedId?: string | null
  /** Called with the node id when a row is clicked or Enter/Space is pressed. */
  onSelect?: (id: string) => void
  /** Controlled set of node ids whose children are visible. */
  expandedIds?: ReadonlySet<string>
  /** Called with the next expansion set whenever a branch is toggled. */
  onExpandedChange?: (ids: Set<string>) => void
  /** Initial open branches in uncontrolled mode; auto-reveals parents otherwise. */
  defaultExpanded?: string[]
  /** Accessible name for the tree container. */
  ariaLabel: string
  /** Centered text rendered when no nodes are visible. */
  emptyLabel?: string
  class?: string
}>()

const { t } = useUITranslation()

function defaultExpandedIds(items: TreeItem[], selectedId?: string | null) {
  const ids = new Set<string>()
  const parentIds = new Set(
    items.map((item) => item.parentId).filter((id): id is string => Boolean(id)),
  )

  for (const item of items) {
    if (!item.parentId && parentIds.has(item.id)) ids.add(item.id)
  }
  if (selectedId) {
    for (const id of treeAncestorIds(items, selectedId)) ids.add(id)
  }

  return ids
}

const tree = computed(() => buildTree(props.items))
const internalExpanded = ref<ReadonlySet<string>>(
  new Set(props.defaultExpanded ?? defaultExpandedIds(props.items, props.selectedId)),
)
const activeExpanded = computed(() => props.expandedIds ?? internalExpanded.value)
const entries = computed(() => visibleTreeEntries(tree.value, activeExpanded.value))

const focusedId = ref<string | null>(props.selectedId ?? null)
const itemRefs = ref(new Map<string, HTMLElement>())

function setItemRef(id: string, el: Element | ComponentPublicInstance | null) {
  if (el) itemRefs.value.set(id, (el as ComponentPublicInstance).$el ?? (el as HTMLElement))
  else itemRefs.value.delete(id)
}

watch(
  () => [props.items, props.selectedId],
  () => {
    if (props.expandedIds) return
    if (internalExpanded.value.size > 0) return
    internalExpanded.value = new Set(
      props.defaultExpanded ?? defaultExpandedIds(props.items, props.selectedId),
    )
  },
)

watch(entries, (next) => {
  if (focusedId.value && next.some((entry) => entry.node.id === focusedId.value)) return
  focusedId.value = props.selectedId ?? next[0]?.node.id ?? null
})

watch(
  () => [props.expandedIds, props.selectedId],
  () => {
    if (props.expandedIds || !props.selectedId) return
    const ancestors = treeAncestorIds(props.items, props.selectedId)
    if (ancestors.length === 0) return
    if (ancestors.every((id) => internalExpanded.value.has(id))) return
    internalExpanded.value = new Set([...internalExpanded.value, ...ancestors])
  },
)

watch(focusedId, (id) => {
  if (!id) return
  itemRefs.value.get(id)?.focus()
})

function focusItem(id: string) {
  focusedId.value = id
  itemRefs.value.get(id)?.focus()
}

function toggleExpanded(id: string) {
  const next = new Set(activeExpanded.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)

  if (!props.expandedIds) internalExpanded.value = next
  props.onExpandedChange?.(next)
}

function handleKeyDown(event: globalThis.KeyboardEvent) {
  if (!focusedId.value) return
  const index = entries.value.findIndex((entry) => entry.node.id === focusedId.value)
  if (index === -1) return
  const entry = entries.value[index]!

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      if (index < entries.value.length - 1) focusItem(entries.value[index + 1]!.node.id)
      break
    case 'ArrowUp':
      event.preventDefault()
      if (index > 0) focusItem(entries.value[index - 1]!.node.id)
      break
    case 'ArrowRight':
      event.preventDefault()
      if (entry.hasChildren && !activeExpanded.value.has(entry.node.id)) {
        toggleExpanded(entry.node.id)
      } else if (entry.hasChildren) {
        focusItem(entries.value[index + 1]!.node.id)
      }
      break
    case 'ArrowLeft':
      event.preventDefault()
      if (entry.hasChildren && activeExpanded.value.has(entry.node.id)) {
        toggleExpanded(entry.node.id)
      } else if (entry.parentId) {
        focusItem(entry.parentId)
      }
      break
    case 'Home':
      event.preventDefault()
      focusItem(entries.value[0]!.node.id)
      break
    case 'End':
      event.preventDefault()
      focusItem(entries.value[entries.value.length - 1]!.node.id)
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      if (!entry.node.disabled) props.onSelect?.(entry.node.id)
      break
  }
}
</script>

<template>
  <div
    ref="root"
    role="tree"
    :aria-label="props.ariaLabel"
    tabindex="-1"
    :class="cn('select-none', props.class)"
    @keydown="handleKeyDown"
  >
    <p
      v-if="entries.length === 0 && props.emptyLabel"
      class="px-2 py-6 text-center text-sm text-muted-foreground"
    >
      {{ props.emptyLabel }}
    </p>
    <div
      v-for="entry in entries"
      :key="entry.node.id"
      :ref="(node) => setItemRef(entry.node.id, node)"
      role="treeitem"
      :aria-level="entry.depth + 1"
      :aria-label="entry.node.badge ? `${entry.node.label}${entry.node.badge}` : entry.node.label"
      :aria-selected="props.selectedId === entry.node.id"
      :aria-expanded="entry.hasChildren ? activeExpanded.has(entry.node.id) : undefined"
      :aria-disabled="entry.node.disabled || undefined"
      :tabindex="focusedId === entry.node.id ? 0 : -1"
      :title="entry.node.description"
      :class="
        cn(
          'flex items-center gap-1.5 rounded-md border border-transparent py-1.5 pe-2 text-sm transition-colors outline-none hover:bg-accent focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
          props.selectedId === entry.node.id && 'bg-primary/10 font-medium text-accent-foreground',
          entry.node.disabled && 'cursor-not-allowed opacity-50',
        )
      "
      :style="{ paddingLeft: `${entry.depth * 16 + 6}px` }"
      @click="
        () => {
          if (entry.node.disabled) return
          focusItem(entry.node.id)
          props.onSelect?.(entry.node.id)
        }
      "
      @focusin="focusedId = entry.node.id"
    >
      <button
        v-if="entry.hasChildren"
        type="button"
        tabindex="-1"
        :aria-label="`${activeExpanded.has(entry.node.id) ? t('enterprise.collapse') : t('enterprise.expand')} ${entry.node.label}`"
        class="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground outline-none hover:bg-background focus-visible:ring-2 focus-visible:ring-ring/50"
        @click.stop="toggleExpanded(entry.node.id)"
        @keydown.stop
      >
        <ChevronRight
          :class="
            cn('size-4 transition-transform', activeExpanded.has(entry.node.id) && 'rotate-90')
          "
        />
      </button>
      <span v-else aria-hidden="true" class="flex size-5 shrink-0 justify-center">
        <span class="mt-1.5 size-1.5 rounded-full bg-border"></span>
      </span>
      <component
        :is="entry.node.icon"
        v-if="entry.node.icon"
        class="size-4 shrink-0 text-muted-foreground"
      />
      <span class="min-w-0 flex-1 truncate">{{ entry.node.label }}</span>
      <span v-if="entry.node.badge" class="shrink-0 text-xs text-muted-foreground">
        {{ entry.node.badge }}
      </span>
    </div>
  </div>
</template>
