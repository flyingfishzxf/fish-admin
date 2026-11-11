<script setup lang="ts">
import { AccordionRoot } from 'reka-ui'

withDefaults(
  defineProps<{
    type?: 'single' | 'multiple'
    collapsible?: boolean
    modelValue?: string | string[]
    defaultValue?: string | string[]
    orientation?: 'vertical' | 'horizontal'
    disabled?: boolean
  }>(),
  { type: 'single', collapsible: false, orientation: 'vertical', disabled: false },
)

const emit = defineEmits<{
  'update:modelValue': [value: string | string[] | undefined]
}>()
</script>

<template>
  <AccordionRoot
    data-slot="accordion"
    :type="type"
    :collapsible="collapsible"
    :model-value="modelValue"
    :default-value="defaultValue"
    :orientation="orientation"
    :disabled="disabled"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <slot />
  </AccordionRoot>
</template>
