<script setup lang="ts">
import { cn } from '@fish-admin/vue'
import type { Component } from 'vue'

// The React template composes five primitives (Card/CardHeader/CardTitle/
// CardDescription/CardContent). Vue pages read better with one component and
// slots, so this carries the same class list and exposes `#header` for the
// right-aligned action slot.
const props = defineProps<{
  title?: string
  description?: string
  icon?: Component
  class?: string
}>()
</script>

<template>
  <section
    data-slot="card"
    :class="
      cn('flex flex-col rounded-xl border bg-card py-6 text-card-foreground shadow-sm', props.class)
    "
  >
    <header
      v-if="props.title || props.description || $slots.header"
      data-slot="card-header"
      class="flex items-start justify-between gap-3 px-6"
      :class="props.title || props.description ? 'pb-4' : ''"
    >
      <div class="flex items-start gap-3">
        <div
          v-if="props.icon"
          class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
          aria-hidden="true"
        >
          <component :is="props.icon" class="size-4" />
        </div>
        <div class="space-y-1">
          <h2 v-if="props.title" data-slot="card-title" class="font-semibold tracking-tight">
            {{ props.title }}
          </h2>
          <p
            v-if="props.description"
            data-slot="card-description"
            class="text-sm text-muted-foreground"
          >
            {{ props.description }}
          </p>
        </div>
      </div>
      <div v-if="$slots.header" class="flex shrink-0 items-center gap-2">
        <slot name="header" />
      </div>
    </header>

    <div data-slot="card-content" class="flex flex-col gap-4 px-6">
      <slot />
    </div>

    <footer v-if="$slots.footer" class="mt-4 border-t px-6 pt-4">
      <slot name="footer" />
    </footer>
  </section>
</template>
