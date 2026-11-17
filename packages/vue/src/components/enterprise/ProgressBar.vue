<script setup lang="ts">
import { cn } from '@fish-admin/vue'
import { computed } from 'vue'

// `@fish-admin/vue` has no Progress primitive and its export surface is frozen;
// this carries the same track/fill classes the React component uses.
const props = withDefaults(
  defineProps<{ value: number; ariaLabel: string; class?: string; tone?: 'default' | 'warning' }>(),
  { class: undefined, tone: 'default' },
)

const clamped = computed(() => Math.min(100, Math.max(0, Math.round(props.value))))
</script>

<template>
  <div
    role="progressbar"
    :aria-label="ariaLabel"
    :aria-valuenow="clamped"
    aria-valuemin="0"
    aria-valuemax="100"
    :class="cn('h-2 w-full overflow-hidden rounded-full bg-muted', props.class)"
    data-progress
  >
    <div
      class="h-full rounded-full transition-all"
      :class="props.tone === 'warning' ? 'bg-destructive' : 'bg-primary'"
      :style="{ width: `${clamped}%` }"
    />
  </div>
</template>
