<script setup lang="ts">
import { ChevronDown, ChevronRight, X } from 'lucide-vue-next'
import { computed, ref, useAttrs } from 'vue'

import { cn } from '../../lib/utils'
import { useUITranslation } from '../../i18n'
import { Button } from '../ui/button'
import Popover from './Popover.vue'

export interface CascaderOption {
  value: string
  label: string
  children?: CascaderOption[]
  disabled?: boolean
}

function findPath(options: CascaderOption[], path: string[]) {
  const trail: CascaderOption[] = []
  let level = options

  for (const value of path) {
    const match = level.find((option) => option.value === value)
    if (!match) break
    trail.push(match)
    level = match.children ?? []
  }

  return trail
}

const props = withDefaults(
  defineProps<{
    /** Root level of the tree; each level is one column. */
    options: CascaderOption[]
    /** Controlled path of option values from root to leaf. */
    value?: string[]
    /** Trigger text when nothing is selected. */
    placeholder: string
    /** Accessible name for the trigger and each column. */
    ariaLabel: string
    /** Copy for the popover when options is empty. */
    emptyLabel?: string
    disabled?: boolean
    class?: string
  }>(),
  { disabled: false, value: () => [] },
)

const emit = defineEmits<{ change: [value: string[]] }>()

// An optional clear handler arrives as the `onClear` attr; its presence decides
// whether the clear affordance renders at all.
const attrs = useAttrs()
const { t } = useUITranslation()
const open = ref(false)
const activePath = ref<string[]>([...props.value])

const trail = computed(() => findPath(props.options, activePath.value))
const selectedTrail = computed(() => findPath(props.options, props.value))
const columns = computed(() => {
  const result: CascaderOption[][] = [props.options]
  for (const option of trail.value) {
    if (option.children?.length) result.push(option.children)
  }
  return result
})

const label = computed(() => selectedTrail.value.map((option) => option.label).join(' / '))

function select(depth: number, option: CascaderOption) {
  if (option.disabled) return
  const prefix = activePath.value.slice(0, depth)
  const nextPath = [...prefix, option.value]
  activePath.value = nextPath

  if (option.children?.length) return
  emit('change', nextPath)
  open.value = false
}

function onOpenChange(next: boolean) {
  open.value = next
  if (next) activePath.value = [...props.value]
}
</script>

<template>
  <div :class="cn('relative', props.class)">
    <Popover
      :open="open"
      align="start"
      class="w-auto max-w-[calc(100vw-2rem)] p-1"
      @update:open="onOpenChange"
    >
      <template #trigger>
        <Button
          type="button"
          variant="outline"
          :aria-label="`${props.ariaLabel}: ${label || props.placeholder}`"
          :aria-expanded="open"
          :disabled="props.disabled"
          :class="
            cn('w-full justify-between gap-2 pe-14 font-normal', !label && 'text-muted-foreground')
          "
        >
          <span class="truncate">{{ label || props.placeholder }}</span>
          <ChevronDown class="size-4 shrink-0 opacity-60" />
        </Button>
      </template>
      <p
        v-if="props.options.length === 0"
        class="px-3 py-6 text-center text-sm text-muted-foreground"
      >
        {{ props.emptyLabel ?? t('enterprise.noMatches') }}
      </p>
      <div v-else class="flex">
        <ul
          v-for="(column, depth) in columns"
          :key="depth"
          :aria-label="`${props.ariaLabel} ${depth + 1}`"
          class="max-h-64 w-44 overflow-y-auto border-e p-1 last:border-e-0"
        >
          <li v-for="option in column" :key="option.value">
            <button
              type="button"
              :aria-pressed="activePath[depth] === option.value"
              :disabled="option.disabled"
              :class="
                cn(
                  'flex w-full items-center gap-1.5 rounded-sm px-2 py-1.5 text-start text-sm transition-colors outline-none hover:bg-accent focus-visible:bg-accent disabled:cursor-not-allowed disabled:opacity-50',
                  activePath[depth] === option.value &&
                    'bg-primary/10 font-medium text-accent-foreground',
                )
              "
              @click="select(depth, option)"
            >
              <span class="min-w-0 flex-1 truncate">{{ option.label }}</span>
              <ChevronRight
                v-if="option.children?.length"
                aria-hidden="true"
                class="size-3.5 shrink-0 opacity-60"
              />
              <span
                v-else-if="activePath[depth] === option.value"
                aria-hidden="true"
                class="size-1.5 rounded-full bg-primary"
              ></span>
            </button>
          </li>
        </ul>
      </div>
    </Popover>
    <button
      v-if="props.value.length > 0 && attrs.onClear"
      type="button"
      :aria-label="t('enterprise.clearSelection')"
      :disabled="props.disabled"
      class="absolute end-8 top-1/2 z-10 flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none"
      @click="(attrs.onClear as () => void)?.()"
    >
      <X class="size-3.5" />
    </button>
  </div>
</template>
