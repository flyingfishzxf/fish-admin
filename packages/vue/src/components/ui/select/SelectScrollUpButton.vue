<script setup lang="ts">
import { ChevronUpIcon } from 'lucide-vue-next'
import { SelectScrollUpButton as SelectScrollUpButtonPrimitive } from 'reka-ui'

import { cn } from '../../../lib/utils'

const props = defineProps<{ class?: string }>()
</script>

<template>
  <SelectScrollUpButtonPrimitive
    data-slot="select-scroll-up-button"
    :class="cn('flex cursor-default items-center justify-center py-1', props.class)"
  >
    <ChevronUpIcon class="size-4" />
  </SelectScrollUpButtonPrimitive>
</template>
