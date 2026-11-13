<script setup lang="ts">
import { Button } from '@fish-admin/vue'
import type { Component } from 'vue'
import { RouterLink } from 'vue-router'

// Shared shell for the four full-page status states. Each route page supplies
// its own code, copy and action so the messages stay in the locale files.
const props = withDefaults(
  defineProps<{
    code: string
    title: string
    description: string
    hint?: string
    action: string
    icon: Component
    actionTo?: string
    tone?: 'destructive' | 'muted'
  }>(),
  { tone: 'destructive' },
)

const emit = defineEmits<{ action: [] }>()
</script>

<template>
  <div class="flex min-h-[65vh] flex-col items-center justify-center px-6 text-center">
    <div
      class="flex size-16 items-center justify-center rounded-3xl"
      :class="
        props.tone === 'destructive'
          ? 'bg-destructive/10 text-destructive'
          : 'bg-muted text-muted-foreground'
      "
    >
      <component :is="props.icon" class="size-7" aria-hidden="true" />
    </div>
    <p class="mt-6 text-xs font-semibold tracking-[0.28em] text-muted-foreground">
      {{ props.code }}
    </p>
    <h1 class="mt-2 text-3xl font-semibold tracking-tight">{{ props.title }}</h1>
    <p class="mt-2 max-w-md text-sm text-muted-foreground">{{ props.description }}</p>
    <p v-if="props.hint" class="mt-1 max-w-md text-xs text-muted-foreground/80">{{ props.hint }}</p>

    <div class="mt-6">
      <Button v-if="props.actionTo" as-child>
        <RouterLink :to="props.actionTo" data-action="status-primary">
          {{ props.action }}
        </RouterLink>
      </Button>
      <Button v-else data-action="status-primary" @click="emit('action')">
        {{ props.action }}
      </Button>
    </div>
  </div>
</template>
