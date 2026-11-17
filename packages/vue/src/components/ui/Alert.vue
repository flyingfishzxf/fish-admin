<script setup lang="ts">
import { cn } from '@fish-admin/vue'
import type { Component } from 'vue'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'default' | 'destructive'
    title?: string
    icon?: Component
    class?: string
  }>(),
  { variant: 'default' },
)

const classes = computed(() =>
  cn(
    'flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-sm',
    props.variant === 'destructive'
      ? 'border-destructive/50 bg-card text-destructive'
      : 'bg-card text-card-foreground',
    props.class,
  ),
)
</script>

<template>
  <div data-slot="alert" :data-variant="props.variant" role="alert" :class="classes">
    <slot name="icon">
      <component
        :is="props.icon"
        v-if="props.icon"
        class="mt-0.5 size-4 shrink-0"
        aria-hidden="true"
      />
    </slot>
    <div class="space-y-1">
      <p v-if="props.title" data-slot="alert-title" class="font-medium tracking-tight">
        {{ props.title }}
      </p>
      <div
        data-slot="alert-description"
        :class="props.variant === 'destructive' ? 'text-destructive' : 'text-muted-foreground'"
      >
        <slot />
      </div>
    </div>
  </div>
</template>
