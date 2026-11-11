<script setup lang="ts">
import { cn } from '../../../lib/utils'
</script>

<template>
  <div data-slot="skeleton" aria-hidden="true" :class="cn('animate-pulse rounded-md bg-accent')" />
</template>
