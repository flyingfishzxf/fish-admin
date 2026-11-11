<script setup lang="ts">
import { AvatarFallback as AvatarFallbackPrimitive } from 'reka-ui'
import { computed } from 'vue'

import { cn } from '../../../lib/utils'

const props = defineProps<{ class?: string }>()
const classes = computed(() =>
  cn(
    'flex size-full items-center justify-center rounded-full bg-muted text-sm text-muted-foreground group-data-[size=sm]/avatar:text-xs',
    props.class,
  ),
)
</script>

<template>
  <AvatarFallbackPrimitive data-slot="avatar-fallback" :class="classes">
    <slot />
  </AvatarFallbackPrimitive>
</template>
