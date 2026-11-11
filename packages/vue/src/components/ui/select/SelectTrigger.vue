<script setup lang="ts">
import { ChevronDownIcon } from 'lucide-vue-next'
import {
  injectSelectRootContext,
  SelectIcon,
  SelectTrigger as SelectTriggerPrimitive,
} from 'reka-ui'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import { cn } from '../../../lib/utils'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{ size?: 'sm' | 'default'; disabled?: boolean; class?: string }>(),
  { size: 'default' },
)

const classes = computed(() =>
  cn(
    "flex w-fit items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[placeholder]:text-muted-foreground data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
    props.class,
  ),
)

const rootContext = injectSelectRootContext()
const trigger = ref<InstanceType<typeof SelectTriggerPrimitive> | null>(null)

// Vue 3.5 stamps a shared `_vts` on every event and skips invokers attached at or before that
// stamp. With a frozen clock those stamps are all equal, so Reka's own pointerdown listener is
// skipped whenever an ancestor DismissableLayer (a Dialog content) handled the capture phase
// first. Re-apply Reka's plain-left-click rule natively; the Vue listener remains the primary path.
function onNativePointerDown(event: PointerEvent) {
  if (event.defaultPrevented || event.button !== 0 || event.ctrlKey) return
  if (event.pointerType === 'touch') return
  if (rootContext.disabled?.value || props.disabled) return
  rootContext.onOpenChange(true)
}

let triggerElement: HTMLElement | null = null

onMounted(() => {
  const element = trigger.value?.$el
  if (!(element instanceof HTMLElement)) return
  triggerElement = element
  element.addEventListener('pointerdown', onNativePointerDown)
})

onBeforeUnmount(() => {
  triggerElement?.removeEventListener('pointerdown', onNativePointerDown)
  triggerElement = null
})
</script>

<template>
  <SelectTriggerPrimitive
    ref="trigger"
    v-bind="$attrs"
    data-slot="select-trigger"
    :data-size="size"
    :disabled="disabled"
    :class="classes"
  >
    <slot />
    <SelectIcon as-child>
      <ChevronDownIcon class="size-4 opacity-50" />
    </SelectIcon>
  </SelectTriggerPrimitive>
</template>
