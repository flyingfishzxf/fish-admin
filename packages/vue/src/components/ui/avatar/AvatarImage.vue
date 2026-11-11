<script setup lang="ts">
import { AvatarImage as AvatarImagePrimitive } from 'reka-ui'
import { computed } from 'vue'

import { cn } from '../../../lib/utils'

const props = defineProps<{ src: string; alt?: string; class?: string }>()
const classes = computed(() => cn('aspect-square size-full', props.class))
</script>

<template>
  <AvatarImagePrimitive data-slot="avatar-image" :src="src" :alt="alt" :class="classes" />
</template>
