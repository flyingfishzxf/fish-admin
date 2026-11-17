<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  /** Small uppercase label above the title, such as "Workspace". */
  eyebrow?: string
}>()
</script>

<template>
  <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div class="space-y-1">
      <p v-if="eyebrow" class="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
        {{ eyebrow }}
      </p>
      <h1 class="text-xl font-semibold tracking-tight sm:text-2xl">{{ title }}</h1>
      <p v-if="description" class="text-sm text-muted-foreground">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
