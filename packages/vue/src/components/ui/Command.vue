<script setup lang="ts">
import type { LucideIcon } from 'lucide-vue-next'
import { Search } from 'lucide-vue-next'
import { computed, ref, useId, watch } from 'vue'

import { cn } from '../../lib/utils'

export interface CommandEntry {
  value: string
  label: string
  description?: string
  icon?: LucideIcon
  shortcut?: string
  keywords?: string
  disabled?: boolean
}

export interface CommandGroupDef {
  heading?: string
  entries: CommandEntry[]
}

const props = withDefaults(
  defineProps<{
    /** Groups in display order; groups without a heading render unlabelled. */
    groups: CommandGroupDef[]
    /** Placeholder of the search field. */
    placeholder?: string
    /** Text shown when nothing matches the query. */
    emptyLabel?: string
    /** Accessible name of the listbox. */
    ariaLabel?: string
    class?: string
  }>(),
  {
    placeholder: 'Type a command or search…',
    emptyLabel: 'No results found.',
    ariaLabel: 'Commands',
  },
)

const emit = defineEmits<{ select: [entry: CommandEntry] }>()

const query = ref('')
const activeIndex = ref(0)
const listId = useId()

const matches = computed(() => {
  const needle = query.value.trim().toLowerCase()
  return props.groups
    .map((group) => ({
      ...group,
      entries: group.entries.filter((entry) => {
        if (!needle) return true
        return `${entry.label} ${entry.description ?? ''} ${entry.keywords ?? ''}`
          .toLowerCase()
          .includes(needle)
      }),
    }))
    .filter((group) => group.entries.length > 0)
})

const flat = computed(() => matches.value.flatMap((group) => group.entries))
const activeEntry = computed(() => flat.value[activeIndex.value])

watch(query, () => (activeIndex.value = 0))

function pick(entry: CommandEntry) {
  if (entry.disabled) return
  emit('select', entry)
}

function onKeydown(event: globalThis.KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, flat.value.length - 1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
  } else if (event.key === 'Enter') {
    event.preventDefault()
    if (activeEntry.value) pick(activeEntry.value)
  }
}
</script>

<template>
  <div
    data-slot="command"
    :class="
      cn(
        'flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground',
        props.class,
      )
    "
    @keydown="onKeydown"
  >
    <div data-slot="command-input-wrapper" class="flex h-12 items-center gap-2 border-b px-3">
      <Search aria-hidden="true" class="size-4 shrink-0 opacity-50" />
      <input
        v-model="query"
        data-slot="command-input"
        type="text"
        :placeholder="props.placeholder"
        :aria-label="props.ariaLabel"
        :aria-controls="listId"
        class="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
    <div
      data-slot="command-list"
      :id="listId"
      role="listbox"
      :aria-label="props.ariaLabel"
      class="max-h-[300px] overflow-x-hidden overflow-y-auto"
    >
      <p v-if="flat.length === 0" data-slot="command-empty" class="py-6 text-center text-sm">
        {{ props.emptyLabel }}
      </p>
      <div
        v-for="group in matches"
        :key="group.heading ?? 'ungrouped'"
        data-slot="command-group"
        class="overflow-hidden p-1 text-foreground"
      >
        <p v-if="group.heading" class="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          {{ group.heading }}
        </p>
        <button
          v-for="entry in group.entries"
          :key="entry.value"
          type="button"
          role="option"
          data-slot="command-item"
          :aria-selected="entry === activeEntry"
          :disabled="entry.disabled"
          :class="
            cn(
              'relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:bg-accent disabled:pointer-events-none disabled:opacity-50',
              entry === activeEntry && 'bg-accent text-accent-foreground',
            )
          "
          @click="pick(entry)"
          @mouseenter="activeIndex = flat.indexOf(entry)"
        >
          <component :is="entry.icon" v-if="entry.icon" aria-hidden="true" class="size-4" />
          <span class="min-w-0 flex-1 text-start">
            <span class="block truncate">{{ entry.label }}</span>
            <span v-if="entry.description" class="block truncate text-xs text-muted-foreground">
              {{ entry.description }}
            </span>
          </span>
          <kbd
            v-if="entry.shortcut"
            data-slot="command-shortcut"
            class="ms-auto text-xs tracking-widest text-muted-foreground"
          >
            {{ entry.shortcut }}
          </kbd>
        </button>
      </div>
    </div>
  </div>
</template>
