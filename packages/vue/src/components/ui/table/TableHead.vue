<script setup lang="ts">
import { cn } from '../../../lib/utils'

defineProps<{ class?: string }>()
</script>

<template>
  <th
    data-slot="table-head"
    :class="
      cn(
        'h-10 px-2 text-start align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pe-0 [&>[role=checkbox]]:translate-y-[2px]',
        $props.class,
      )
    "
  >
    <slot />
  </th>
</template>
