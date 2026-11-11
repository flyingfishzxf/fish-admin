<script setup lang="ts">
import { DropdownMenuRoot } from 'reka-ui'

withDefaults(defineProps<{ open?: boolean; defaultOpen?: boolean; modal?: boolean }>(), {
  open: undefined,
  defaultOpen: undefined,
  modal: true,
})

const emit = defineEmits<{ 'update:open': [value: boolean] }>()
</script>

<template>
  <DropdownMenuRoot
    data-slot="dropdown-menu"
    :open="open"
    :default-open="defaultOpen"
    :modal="modal"
    @update:open="emit('update:open', $event)"
  >
    <slot />
  </DropdownMenuRoot>
</template>
