<script setup lang="ts">
import {
  PopoverContent as PopoverContentPrimitive,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from 'reka-ui'
import { computed } from 'vue'

// Vue casts an absent Boolean prop to `false`, which would make Reka treat every
// popover as controlled and permanently closed. Keeping `open` undefined lets
// PopoverRoot own its state until a caller binds it (same note as Dialog.vue).
const props = withDefaults(
  defineProps<{ open?: boolean; align?: 'start' | 'center' | 'end'; class?: string }>(),
  { open: undefined, align: 'end' },
)

const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const classes = computed(
  () =>
    `z-50 w-80 origin-(--reka-popover-content-transform-origin) rounded-lg border bg-popover text-popover-foreground shadow-md outline-none duration-(--motion-duration-fast) ease-(--motion-ease-standard) data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 motion-reduce:animate-none! ${props.class ?? ''}`,
)
</script>

<template>
  <PopoverRoot :open="open" @update:open="emit('update:open', $event)">
    <PopoverTrigger as-child>
      <slot name="trigger" />
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContentPrimitive data-popover :align="align" :side-offset="6" :class="classes">
        <slot />
      </PopoverContentPrimitive>
    </PopoverPortal>
  </PopoverRoot>
</template>
