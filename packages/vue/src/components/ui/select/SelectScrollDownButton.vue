<script setup lang="ts">
import { ChevronDownIcon } from 'lucide-vue-next'
import { SelectScrollDownButton as SelectScrollDownButtonPrimitive } from 'reka-ui'

import { cn } from '../../../lib/utils'

const props = defineProps<{ class?: string }>()
</script>

<template>
  <SelectScrollDownButtonPrimitive
    data-slot="select-scroll-down-button"
    :class="cn('flex cursor-default items-center justify-center py-1', props.class)"
  >
    <ChevronDownIcon class="size-4" />
  </SelectScrollDownButtonPrimitive>
</template>
