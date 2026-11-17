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
    `z-50 w-80 rounded-lg border bg-popover text-popover-foreground shadow-md outline-none ${props.class ?? ''}`,
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
