<script setup lang="ts">
import { computed, ref } from 'vue'

import { cn } from '../../lib/utils'
import { useUITranslation } from '../../i18n'

export interface AutoCompleteOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    id?: string
    /** Suggestions to filter; the list is shown as-is while the query is empty. */
    options: AutoCompleteOption[]
    /** Controlled query text; the label of a picked option is written back here. */
    value: string
    placeholder?: string
    /** Accessible name for both the input and the listbox. */
    ariaLabel: string
    /** Row shown when no option matches the query. */
    emptyLabel?: string
    /** Replaces the list with a single centred loading row. */
    loading?: boolean
    /** Copy for the loading row. */
    loadingLabel?: string
    disabled?: boolean
    /** Open the list when the input receives focus. */
    openOnFocus?: boolean
    class?: string
  }>(),
  { loading: false, openOnFocus: true },
)

const { t } = useUITranslation()

const emit = defineEmits<{
  'update:value': [value: string]
  select: [option: AutoCompleteOption]
}>()

const open = ref(false)
const activeIndex = ref(-1)
const inputId = `autocomplete-${Math.random().toString(36).slice(2, 8)}`

const filtered = computed(() => {
  const query = props.value.trim().toLowerCase()
  if (!query) return props.options
  return props.options.filter(
    (option) =>
      option.label.toLowerCase().includes(query) ||
      option.description?.toLowerCase().includes(query),
  )
})

function selectOption(option: AutoCompleteOption) {
  if (option.disabled) return
  emit('update:value', option.label)
  emit('select', option)
  open.value = false
  activeIndex.value = -1
}

function onKeydown(event: globalThis.KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    open.value = true
    activeIndex.value = Math.min(activeIndex.value + 1, filtered.value.length - 1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
  } else if (event.key === 'Enter') {
    if (open.value && filtered.value[activeIndex.value]) {
      event.preventDefault()
      selectOption(filtered.value[activeIndex.value]!)
    }
  } else if (event.key === 'Escape') {
    open.value = false
    activeIndex.value = -1
  }
}
</script>

<template>
  <div :class="cn('relative', props.class)">
    <input
      :id="props.id ?? inputId"
      type="text"
      role="combobox"
      :aria-expanded="open"
      :aria-controls="open ? inputId : undefined"
      :aria-autocomplete="'list'"
      :value="props.value"
      :placeholder="props.placeholder"
      :aria-label="props.ariaLabel"
      :disabled="props.disabled"
      class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
      @input="emit('update:value', ($event.target as HTMLInputElement).value)"
      @focus="
        () => {
          if (props.openOnFocus) open = true
        }
      "
      @blur="open = false"
      @keydown="onKeydown"
    />
    <ul
      v-if="open && (props.loading || filtered.length > 0 || props.emptyLabel)"
      :id="inputId"
      role="listbox"
      :aria-label="props.ariaLabel"
      class="absolute top-full z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
    >
      <li
        v-if="props.loading"
        role="option"
        aria-disabled="true"
        class="py-4 text-center text-sm text-muted-foreground"
      >
        {{ props.loadingLabel ?? t('enterprise.loading') }}
      </li>
      <li
        v-else-if="filtered.length === 0"
        role="option"
        aria-disabled="true"
        class="py-4 text-center text-sm text-muted-foreground"
      >
        {{ props.emptyLabel ?? t('enterprise.noMatches') }}
      </li>
      <li v-else aria-hidden="true" class="contents">
        <div v-for="(option, index) in filtered" :key="option.value">
          <button
            v-if="index === activeIndex"
            type="button"
            role="option"
            :aria-selected="true"
            class="relative flex w-full cursor-default items-center gap-2 rounded-sm bg-accent px-2 py-1.5 text-start text-sm text-accent-foreground outline-none select-none"
            @mousedown.prevent="selectOption(option)"
          >
            <span class="min-w-0 flex-1">
              <span class="block truncate">{{ option.label }}</span>
              <span v-if="option.description" class="block truncate text-xs text-muted-foreground">
                {{ option.description }}
              </span>
            </span>
          </button>
          <button
            v-else
            type="button"
            role="option"
            :aria-selected="false"
            class="relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-start text-sm outline-none select-none hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
            :disabled="option.disabled"
            @mousedown.prevent="selectOption(option)"
          >
            <span class="min-w-0 flex-1">
              <span class="block truncate">{{ option.label }}</span>
              <span v-if="option.description" class="block truncate text-xs text-muted-foreground">
                {{ option.description }}
              </span>
            </span>
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>
