<script setup lang="ts">
import { computed, provide, reactive, watch } from 'vue'

import { cn } from '../../../lib/utils'
import {
  RESIZABLE_KEY,
  clampSplit,
  initialSizes,
  type ResizableContext,
  type ResizableOrientation,
  type ResizablePanelConfig,
} from './context'

const props = withDefaults(
  defineProps<{
    orientation?: ResizableOrientation
    class?: string
  }>(),
  { orientation: 'horizontal' },
)

const panels = reactive<ResizablePanelConfig[]>([])
const sizes = reactive<number[]>([])
let handleCount = 0

watch(
  () => props.orientation,
  () => {
    sizes.splice(0, sizes.length, ...initialSizes(panels))
  },
)

function registerPanel(config: ResizablePanelConfig) {
  const index = panels.length
  panels.push(config)
  const next = initialSizes(panels)
  sizes.splice(0, sizes.length, ...next)
  return index
}

function registerHandle() {
  return handleCount++
}

function resize(handleIndex: number, nextLeft: number) {
  const leftIndex = handleIndex
  const rightIndex = handleIndex + 1
  if (rightIndex >= sizes.length) return
  const left = clampSplit(nextLeft, panels[leftIndex] ?? {}, panels[rightIndex] ?? {})
  sizes[leftIndex] = left
  sizes[rightIndex] = 100 - left
}

const context: ResizableContext = {
  orientation: computed(() => props.orientation).value,
  sizes,
  panels,
  registerPanel,
  registerHandle,
  resize,
}
provide(RESIZABLE_KEY, context)
</script>

<template>
  <div
    data-slot="resizable-panel-group"
    :aria-orientation="props.orientation"
    :class="cn('flex h-full w-full', props.orientation === 'vertical' && 'flex-col', props.class)"
  >
    <slot />
  </div>
</template>
