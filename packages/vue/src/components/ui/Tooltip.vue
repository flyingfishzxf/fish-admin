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
          class="z-50 w-fit origin-(--reka-tooltip-content-transform-origin) animate-in rounded-md bg-foreground px-3 py-1.5 text-xs text-background shadow-md duration-(--motion-duration-fast) ease-(--motion-ease-standard) fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 motion-reduce:animate-none!"
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
