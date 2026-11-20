<script setup lang="ts">
import {
  TooltipArrow,
  TooltipContent as TooltipContentPrimitive,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from 'reka-ui'

const props = withDefaults(
  defineProps<{
    delayDuration?: number
    /** Preferred side of the trigger. */
    side?: 'top' | 'right' | 'bottom' | 'left'
    /** Alignment along the chosen side. */
    align?: 'start' | 'center' | 'end'
  }>(),
  { delayDuration: 0, side: 'top', align: 'center' },
)
</script>

<template>
  <TooltipProvider :delay-duration="props.delayDuration" data-slot="tooltip-provider">
    <TooltipRoot data-slot="tooltip">
      <TooltipTrigger as-child data-slot="tooltip-trigger">
        <slot name="trigger" />
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContentPrimitive
          data-slot="tooltip-content"
          :side="props.side"
          :align="props.align"
          :side-offset="0"
          class="z-50 w-fit origin-(--reka-tooltip-content-transform-origin) rounded-md bg-foreground px-3 py-1.5 text-xs text-background shadow-md"
        >
          <slot />
          <TooltipArrow
            class="z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground"
          />
        </TooltipContentPrimitive>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>
