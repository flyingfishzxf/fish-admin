<script setup lang="ts">
import { GripVerticalIcon } from 'lucide-vue-next'
import { computed, onBeforeUnmount, ref } from 'vue'

import { cn } from '../../../lib/utils'
import { useResizable } from './context'

const props = withDefaults(
  defineProps<{
    /** Render a grip icon in the middle of the separator. */
    withHandle?: boolean
    class?: string
  }>(),
  { withHandle: false },
)

const context = useResizable()
const index = context.registerHandle()
const dragging = ref(false)

function onPointerMove(event: PointerEvent) {
  if (!dragging.value) return
  const parent = (event.currentTarget as HTMLElement | null)?.parentElement
  if (!parent) return
  const rect = parent.getBoundingClientRect()
  const ratio =
    context.orientation === 'vertical'
      ? (event.clientY - rect.top) / rect.height
      : (event.clientX - rect.left) / rect.width
  const leftSize = context.sizes.slice(0, index).reduce((sum, size) => sum + size, 0)
  context.resize(index, ratio * 100 - leftSize)
}

function stop() {
  dragging.value = false
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', stop)
}

function onPointerDown(event: PointerEvent) {
  dragging.value = true
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', stop)
  event.preventDefault()
}

onBeforeUnmount(stop)

const classes = computed(() =>
  cn(
    'relative flex shrink-0 items-center justify-center bg-border outline-none focus-visible:ring-1 focus-visible:ring-ring',
    context.orientation === 'vertical'
      ? 'h-px w-full cursor-row-resize after:absolute after:inset-x-0 after:top-1/2 after:h-1 after:-translate-y-1/2'
      : 'w-px cursor-col-resize after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2',
    props.class,
  ),
)
</script>

<template>
  <div
    data-slot="resizable-handle"
    role="separator"
    :aria-orientation="context.orientation"
    :class="classes"
    @pointerdown="onPointerDown"
  >
    <div
      v-if="props.withHandle"
      class="z-10 flex h-4 w-3 items-center justify-center rounded-xs border bg-border"
    >
      <GripVerticalIcon class="size-2.5" />
    </div>
  </div>
</template>
