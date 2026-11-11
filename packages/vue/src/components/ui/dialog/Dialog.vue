<script setup lang="ts">
import { DialogRoot } from 'reka-ui'

// Vue casts an absent Boolean prop to `false`, which would make Reka treat every Dialog as
// controlled. Keeping `open` undefined lets DialogRoot own its state until a caller binds it.
const props = withDefaults(
  defineProps<{ open?: boolean; defaultOpen?: boolean; modal?: boolean }>(),
  {
    open: undefined,
    modal: true,
  },
)

const emit = defineEmits<{ 'update:open': [value: boolean] }>()
</script>

<template>
  <DialogRoot
    data-slot="dialog"
    :open="props.open"
    :default-open="defaultOpen"
    :modal="modal"
    @update:open="emit('update:open', $event)"
  >
    <slot />
  </DialogRoot>
</template>
