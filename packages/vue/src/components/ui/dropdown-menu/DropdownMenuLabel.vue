<script setup lang="ts">
import { DropdownMenuLabel as DropdownMenuLabelPrimitive } from 'reka-ui'
import { computed } from 'vue'

import { cn } from '../../../lib/utils'

const props = withDefaults(defineProps<{ inset?: boolean; class?: string }>(), { inset: false })
const classes = computed(() => cn('px-2 py-1.5 text-sm font-medium data-[inset]:ps-8', props.class))
</script>

<template>
  <DropdownMenuLabelPrimitive
    data-slot="dropdown-menu-label"
    :data-inset="inset || undefined"
    :class="classes"
  >
    <slot />
  </DropdownMenuLabelPrimitive>
</template>
