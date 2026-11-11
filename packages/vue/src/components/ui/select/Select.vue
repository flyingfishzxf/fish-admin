<script setup lang="ts">
import { SelectRoot } from 'reka-ui'

defineProps<{
  modelValue?: string
  defaultValue?: string
  disabled?: boolean
  name?: string
  required?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

function onValueChange(value: unknown) {
  emit('update:modelValue', String(value))
}
</script>

<template>
  <SelectRoot
    data-slot="select"
    :model-value="modelValue"
    :default-value="defaultValue"
    :disabled="disabled"
    :name="name"
    :required="required"
    @update:model-value="onValueChange"
  >
    <slot />
  </SelectRoot>
</template>
