<script setup lang="ts">
import { ChevronDown, X } from 'lucide-vue-next'
import { computed, ref, useAttrs } from 'vue'

import { useUITranslation } from '../../i18n'
import { treePath } from '../../lib/tree'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import Popover from './Popover.vue'
import Tree from './Tree.vue'
import type { TreeItem } from './Tree.vue'

const props = withDefaults(
  defineProps<{
    /** DOM id forwarded to the trigger button. */
    id?: string
    /** Flat tree records rendered inside the popover. */
    items: TreeItem[]
    /** Selected node id; `null` or `undefined` shows the placeholder. */
    value?: string | null
    /** Trigger text while nothing is selected. */
    placeholder: string
    /** Accessible name; the selected path or placeholder is appended to it. */
    ariaLabel: string
    /** Text shown in the popover when the tree has no nodes. */
    emptyLabel?: string
    disabled?: boolean
    class?: string
    /** Marks the field invalid; forwarded to the trigger button. */
    invalid?: boolean
    /** Ids of hint or error text; forwarded to the trigger button. */
    describedBy?: string
  }>(),
  { disabled: false },
)

const emit = defineEmits<{ change: [id: string] }>()

const attrs = useAttrs()
const { t } = useUITranslation()
const open = ref(false)

const selectedLabel = computed(() => {
  if (!props.value) return undefined
  const path = treePath(props.items, props.value)
  return path.length > 0 ? path.map((item) => item.label).join(' / ') : undefined
})

function onOpenChange(next: boolean) {
  open.value = next
}

function select(id: string) {
  emit('change', id)
  open.value = false
}
</script>

<template>
  <div :class="cn('relative', props.class)">
    <Popover
      :open="open"
      align="start"
      class="w-80 max-w-[calc(100vw-2rem)] p-1"
      @update:open="onOpenChange"
    >
      <template #trigger>
        <Button
          :id="props.id"
          type="button"
          variant="outline"
          :aria-label="`${props.ariaLabel}: ${selectedLabel ?? props.placeholder}`"
          :aria-expanded="open"
          :aria-invalid="props.invalid"
          :aria-describedby="props.describedBy"
          :disabled="props.disabled"
          :class="
            cn(
              'w-full justify-between gap-2 pe-14 font-normal',
              !selectedLabel && 'text-muted-foreground',
            )
          "
        >
          <span class="truncate">{{ selectedLabel ?? props.placeholder }}</span>
          <ChevronDown class="size-4 shrink-0 opacity-60" />
        </Button>
      </template>
      <Tree
        :items="props.items"
        :selected-id="props.value"
        :aria-label="props.ariaLabel"
        :ariaLabel="props.ariaLabel"
        :empty-label="props.emptyLabel"
        class="max-h-72 overflow-y-auto p-1"
        :on-select="select"
      />
    </Popover>
    <button
      v-if="props.value && attrs.onClear"
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
