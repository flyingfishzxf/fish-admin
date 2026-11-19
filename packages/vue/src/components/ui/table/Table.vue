<script setup lang="ts">
import { cn } from '../../../lib/utils'

withDefaults(defineProps<{ container?: boolean; class?: string }>(), { container: true })
</script>

<template>
  <div
    v-if="container"
    data-slot="table-container"
    tabindex="0"
    class="relative w-full overflow-x-auto"
  >
    <table data-slot="table" :class="cn('w-full caption-bottom text-sm', $props.class)">
      <slot />
    </table>
  </div>
  <table v-else data-slot="table" :class="cn('w-full caption-bottom text-sm', $props.class)">
    <slot />
  </table>
</template>
