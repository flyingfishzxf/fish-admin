<script setup lang="ts">
import { AvatarRoot } from 'reka-ui'
import { computed } from 'vue'

import { cn } from '../../../lib/utils'

const props = withDefaults(defineProps<{ size?: 'default' | 'sm' | 'lg'; class?: string }>(), {
  size: 'default',
})

const classes = computed(() =>
  cn(
    'group/avatar relative flex size-8 shrink-0 overflow-hidden rounded-full select-none data-[size=lg]:size-10 data-[size=sm]:size-6',
    props.class,
  ),
)
</script>

<template>
  <AvatarRoot data-slot="avatar" :data-size="size" :class="classes">
    <slot />
  </AvatarRoot>
</template>
