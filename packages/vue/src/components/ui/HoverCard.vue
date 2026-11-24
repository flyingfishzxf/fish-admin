<script setup lang="ts">
import {
  HoverCardContent as HoverCardContentPrimitive,
  HoverCardPortal,
  HoverCardRoot,
  HoverCardTrigger,
} from 'reka-ui'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    align?: 'start' | 'center' | 'end'
    sideOffset?: number
    class?: string
  }>(),
  { align: 'center', sideOffset: 4 },
)

const classes = computed(
  () =>
    `z-50 w-64 origin-(--reka-hover-card-content-transform-origin) rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none duration-(--motion-duration-fast) ease-(--motion-ease-standard) data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 motion-reduce:animate-none! ${props.class ?? ''}`,
)
</script>

<template>
  <HoverCardRoot data-slot="hover-card">
    <HoverCardTrigger data-slot="hover-card-trigger" as-child>
      <slot name="trigger" />
    </HoverCardTrigger>
    <HoverCardPortal data-slot="hover-card-portal">
      <HoverCardContentPrimitive
        data-slot="hover-card-content"
        :align="props.align"
        :side-offset="props.sideOffset"
        :class="classes"
      >
        <slot />
      </HoverCardContentPrimitive>
    </HoverCardPortal>
  </HoverCardRoot>
</template>
