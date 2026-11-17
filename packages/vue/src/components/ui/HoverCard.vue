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
    `z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none ${props.class ?? ''}`,
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
