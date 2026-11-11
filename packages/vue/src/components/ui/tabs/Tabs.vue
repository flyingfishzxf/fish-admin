<script setup lang="ts">
import { TabsRoot } from 'reka-ui'

import { cn } from '../../../lib/utils'

withDefaults(
  defineProps<{
    modelValue?: string
    defaultValue?: string
    orientation?: 'horizontal' | 'vertical'
    activationMode?: 'automatic' | 'manual'
    disabled?: boolean
  }>(),
  { orientation: 'horizontal' },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <TabsRoot
    data-slot="tabs"
    :data-orientation="orientation"
    :orientation="orientation"
    :model-value="modelValue"
    :default-value="defaultValue"
    :activation-mode="activationMode"
    :disabled="disabled"
    :class="cn('group/tabs flex gap-2 data-[orientation=horizontal]:flex-col')"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <slot />
  </TabsRoot>
</template>
