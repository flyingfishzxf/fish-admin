<script setup lang="ts">
import { cn } from '@fish-admin/vue'

const props = defineProps<{ projectKey: string; class?: string }>()
</script>

<template>
  <!-- Decorative: the project name always sits beside it, so the key stays out
       of the accessibility tree exactly as the React mark does. -->
  <span
    aria-hidden="true"
    :class="
      cn(
        'flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-semibold tracking-wide text-accent-foreground',
        props.class,
      )
    "
    data-project-key
  >
    {{ props.projectKey }}
  </span>
</template>
