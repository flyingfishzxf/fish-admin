<script setup lang="ts">
import { DropdownMenuRadioGroup as DropdownMenuRadioGroupPrimitive } from 'reka-ui'

const props = defineProps<{ modelValue?: string }>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

</script>

<template>
  <DropdownMenuRadioGroupPrimitive
    data-slot="dropdown-menu-radio-group"
    :model-value="props.modelValue"
    @update:model-value="emit('update:modelValue', $event as string)"
  >
    <slot />
  </DropdownMenuRadioGroupPrimitive>
</template>
