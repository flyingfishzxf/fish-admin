<script setup lang="ts">
import { cn } from '@fish-admin/vue'
import type { Component } from 'vue'

const props = defineProps<{
  icon?: Component
  title: string
  description?: string
  class?: string
}>()
</script>

<template>
  <div
    :class="
      cn('flex flex-col items-center justify-center gap-3 px-6 py-14 text-center', props.class)
    "
  >
    <div
      v-if="icon"
      class="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground"
    >
      <component :is="icon" class="size-5" />
    </div>
    <div class="space-y-1">
      <p class="text-sm font-semibold">{{ title }}</p>
      <p v-if="description" class="mx-auto max-w-sm text-sm text-muted-foreground">
        {{ description }}
      </p>
    </div>
    <slot name="action" />
  </div>
</template>
