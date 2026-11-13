<script setup lang="ts">
import { cn } from '@fish-admin/vue'

const props = defineProps<{ class?: string }>()
</script>

<template>
  <div
    role="separator"
    aria-orientation="horizontal"
    :class="cn('h-px w-full shrink-0 bg-border', props.class)"
  />
</template>
