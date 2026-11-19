<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'

import { cn } from '../../../lib/utils'
import { useResizable } from './context'

const props = withDefaults(
  defineProps<{
    defaultSize?: number
    minSize?: number
    maxSize?: number
    class?: string
  }>(),
  {},
)

const context = useResizable()
const index = context.registerPanel({
  defaultSize: props.defaultSize,
  minSize: props.minSize,
  maxSize: props.maxSize,
})
const size = ref(context.sizes[index] ?? props.defaultSize ?? 50)

onBeforeUnmount(() => {
  // The group's arrays are append-only within a mount cycle; leaving a panel
  // only needs to stop the renderer from reading a stale size.
  size.value = 0
})
</script>

<template>
  <div
    data-slot="resizable-panel"
    :style="
      context.orientation === 'vertical'
        ? {
            height: `${context.sizes[index] ?? size}%`,
            minHeight: props.minSize ? `${props.minSize}%` : undefined,
          }
        : {
            width: `${context.sizes[index] ?? size}%`,
            minWidth: props.minSize ? `${props.minSize}%` : undefined,
          }
    "
    :class="cn('min-h-0 min-w-0 overflow-auto', props.class)"
  >
    <slot />
  </div>
</template>
