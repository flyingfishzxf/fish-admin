<script setup lang="ts">
import {
  TooltipArrow,
  TooltipContent as TooltipContentPrimitive,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from 'reka-ui'
withDefaults(
  defineProps<{
    delayDuration?: number
  }>(),
  { delayDuration: 0 },
)
</script>

<template>
  <TooltipProvider :delay-duration="delayDuration" data-slot="tooltip-provider">
    <TooltipRoot data-slot="tooltip">
      <TooltipTrigger as-child data-slot="tooltip-trigger">
        <slot name="trigger" />
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContentPrimitive
          data-slot="tooltip-content"
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
