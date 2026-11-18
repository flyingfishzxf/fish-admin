<script setup lang="ts">
import { Check, ChevronsUpDown, X } from 'lucide-vue-next'
import { computed, ref, useAttrs } from 'vue'

import { cn } from '../../lib/utils'
import { useUITranslation } from '../../i18n'
import { Button } from '../ui/button'
import Popover from './Popover.vue'

export interface ComboboxOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    /** DOM id applied to the trigger button. */
    id?: string
    /** Options rendered in the list; label and description are both searchable. */
    options: ComboboxOption[]
    /** Currently selected option value; the label is looked up in `options`. */
    value?: string | null
    /** Trigger text shown while nothing is selected. */
    placeholder: string
    /** Placeholder of the search field; defaults to the localized "Search…". */
    searchPlaceholder?: string
    /** Text shown when the search matches nothing. */
    emptyLabel?: string
    /** Accessible name of the combobox trigger. */
    ariaLabel: string
    /** Accessible name of the clear button; defaults to "Clear selection". */
    clearLabel?: string
    /** Disables the trigger, the clear button and the list. */
    disabled?: boolean
    class?: string
  }>(),
  { disabled: false },
)

const emit = defineEmits<{ change: [value: string] }>()

const { t } = useUITranslation()
const attrs = useAttrs()
const open = ref(false)
const query = ref('')

const selected = computed(() => props.options.find((option) => option.value === props.value))

const filtered = computed(() => {
  const needle = query.value.trim().toLowerCase()
  if (!needle) return props.options
  return props.options.filter(
    (option) =>
      option.label.toLowerCase().includes(needle) ||
      option.description?.toLowerCase().includes(needle),
  )
})

function pick(option: ComboboxOption) {
  emit('change', option.value)
  open.value = false
}
</script>

<template>
  <div :class="cn('relative', props.class)">
    <Popover :open="open" align="start" class="w-auto min-w-56 p-0" @update:open="open = $event">
      <template #trigger>
        <Button
          :id="props.id"
          type="button"
          variant="outline"
          role="combobox"
          :aria-label="props.ariaLabel"
          :aria-expanded="open"
          :disabled="props.disabled"
          :class="
            cn(
              'w-full justify-between gap-2 pe-14 font-normal',
              !selected && 'text-muted-foreground',
            )
          "
        >
          <span class="truncate">{{ selected?.label ?? props.placeholder }}</span>
          <ChevronsUpDown class="size-4 shrink-0 opacity-60" />
        </Button>
      </template>
      <div class="border-b p-1">
        <input
          v-model="query"
          type="text"
          class="flex h-9 w-full rounded-md bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
          :placeholder="props.searchPlaceholder ?? t('enterprise.search')"
        />
      </div>
      <div class="max-h-72 overflow-y-auto p-1">
        <p v-if="filtered.length === 0" class="py-4 text-center text-sm text-muted-foreground">
          {{ props.emptyLabel ?? t('enterprise.noMatches') }}
        </p>
        <button
          v-for="option in filtered"
          :key="option.value"
          type="button"
          class="relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-start text-sm outline-none select-none hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
          :disabled="option.disabled"
          @click="pick(option)"
        >
          <Check
            aria-hidden="true"
            :class="
              cn('size-4 shrink-0', option.value === props.value ? 'opacity-100' : 'opacity-0')
            "
          />
          <span class="min-w-0 flex-1">
            <span class="block truncate">{{ option.label }}</span>
            <span v-if="option.description" class="block truncate text-xs text-muted-foreground">
              {{ option.description }}
            </span>
          </span>
        </button>
      </div>
    </Popover>
    <button
      v-if="props.value && attrs.onClear"
      type="button"
      :aria-label="props.clearLabel ?? t('enterprise.clearSelection')"
      :disabled="props.disabled"
      class="absolute end-8 top-1/2 z-10 flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none"
      @click="(attrs.onClear as () => void)?.()"
    >
      <X class="size-3.5" />
    </button>
  </div>
</template>
