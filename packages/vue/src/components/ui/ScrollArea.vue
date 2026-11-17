<script setup lang="ts">
import {
  ScrollAreaCorner,
  ScrollAreaRoot,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from 'reka-ui'
import { cn } from '../../lib/utils'

const props = withDefaults(
  defineProps<{
    /** Scrollbar orientation. */
    orientation?: 'vertical' | 'horizontal'
    class?: string
  }>(),
  { orientation: 'vertical' },
)
</script>

<template>
  <ScrollAreaRoot data-slot="scroll-area" :class="cn('relative', props.class)">
    <ScrollAreaViewport
      data-slot="scroll-area-viewport"
      tabindex="0"
      class="size-full max-h-[inherit] rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1"
    >
      <slot />
    </ScrollAreaViewport>
    <ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      :orientation="props.orientation"
      :class="
        cn(
          'flex touch-none p-px transition-colors select-none',
          props.orientation === 'vertical' && 'h-full w-2.5 border-s border-s-transparent',
          props.orientation === 'horizontal' && 'h-2.5 flex-col border-t border-t-transparent',
        )
      "
    >
      <ScrollAreaThumb
        data-slot="scroll-area-thumb"
        class="relative flex-1 rounded-full bg-border"
      />
    </ScrollAreaScrollbar>
    <ScrollAreaCorner />
  </ScrollAreaRoot>
</template>
