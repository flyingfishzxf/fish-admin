<script setup lang="ts">
import { DropdownMenuSeparator as DropdownMenuSeparatorPrimitive } from 'reka-ui'
import { computed } from 'vue'

import { cn } from '../../../lib/utils'

const props = defineProps<{ class?: string }>()
const classes = computed(() => cn('-mx-1 my-1 h-px bg-border', props.class))
</script>

<template>
  <DropdownMenuSeparatorPrimitive data-slot="dropdown-menu-separator" :class="classes" />
</template>
