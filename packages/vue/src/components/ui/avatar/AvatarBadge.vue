<script setup lang="ts">
import { computed, useAttrs } from 'vue'

import { cn } from '../../../lib/utils'

defineOptions({ inheritAttrs: false })

const attrs = useAttrs()
const hasLabel = computed(() => Boolean(attrs['aria-label']))
</script>

<template>
  <span
    data-slot="avatar-badge"
    :role="hasLabel ? 'img' : undefined"
    :aria-label="hasLabel ? String(attrs['aria-label']) : undefined"
    :class="
      cn(
        'absolute end-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background select-none',
        'group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden',
        'group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2',
        'group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2',
        attrs.class as string | undefined,
      )
    "
  >
    <slot />
  </span>
</template>
